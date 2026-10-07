package app.viyuni.herta;

import android.app.Activity;
import android.content.*;
import android.view.TextureView;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.*;
import org.junit.runner.RunWith;
import java.io.*;
import java.nio.*;
import java.lang.reflect.Field;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public final class PlaybackServiceTest {
    private final android.app.Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
    private Context context;
    private File fixture;

    @Test public void retainsIndependentAudioAfterSurfaceDetachAndBackground() throws Exception {
        context = instrumentation.getTargetContext();
        fixture = new File(context.getCacheDir(), "herta-audio-test.wav");
        writeWave(fixture);
        Activity activity = instrumentation.startActivitySync(context.getPackageManager().getLaunchIntentForPackage(context.getPackageName()).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        try {
            main(() -> {
                PlaybackService.prepare(context, 1001, fixture.toURI().toString(), "{}", .12f);
                PlaybackService.prepare(context, 1002, fixture.toURI().toString(), "{}", .67f);
                PlaybackService.attach(1001, new TextureView(activity));
            });
            long deadline = android.os.SystemClock.elapsedRealtime() + 20000;
            while (!get(() -> PlaybackService.ready(1001) && PlaybackService.ready(1002)) && android.os.SystemClock.elapsedRealtime() < deadline) Thread.sleep(200);
            assertTrue("Both channels must become ready", get(() -> PlaybackService.ready(1001) && PlaybackService.ready(1002)));
            assertEquals(.12f, get(() -> player(1001).getVolume()), .001f);
            assertEquals(.67f, get(() -> player(1002).getVolume()), .001f);
            main(() -> PlaybackService.setWorkspaceName("测试工作区"));
            assertEquals("测试工作区 · 2 个直播间", notificationSubtitle());
            main(() -> { PlaybackService.volume(1001, 0); PlaybackService.detach(1001); activity.moveTaskToBack(true); });
            assertEquals(0f, get(() -> player(1001).getVolume()), .001f);
            assertEquals(.67f, get(() -> player(1002).getVolume()), .001f);
            long first = get(() -> player(1001).getCurrentPosition());
            long second = get(() -> player(1002).getCurrentPosition());
            instrumentation.getUiAutomation().executeShellCommand("input keyevent 223").close();
            Thread.sleep(2200);
            assertTrue("Detached channel continues in background", get(() -> player(1001).getCurrentPosition()) > first + 1000);
            assertTrue("Second channel continues in background", get(() -> player(1002).getCurrentPosition()) > second + 1000);
            main(() -> context.startService(new Intent(context, PlaybackService.class).setAction("pause")));
            Thread.sleep(500);
            assertFalse(get(() -> player(1001).isPlaying()));
            assertFalse(get(() -> player(1002).isPlaying()));
            main(() -> PlaybackService.setWorkspaceName("改名工作区"));
            assertEquals("改名工作区 · 2 个直播间", notificationSubtitle());
            assertFalse("Changing the subtitle must preserve paused playback", get(() -> player(1002).isPlaying()));
            main(() -> context.startService(new Intent(context, PlaybackService.class).setAction("play")));
            Thread.sleep(700);
            assertTrue(get(() -> player(1001).isPlaying() && player(1002).isPlaying()));
            main(() -> PlaybackService.release(1001));
            assertEquals("改名工作区 · 1 个直播间", notificationSubtitle());
            assertTrue(get(() -> player(1002).isPlaying()));
        } finally {
            instrumentation.getUiAutomation().executeShellCommand("input keyevent 224").close();
            main(() -> { PlaybackService.release(1001); PlaybackService.release(1002); });
            fixture.delete();
        }
    }
    private void main(Runnable action) { instrumentation.runOnMainSync(action); }
    private String notificationSubtitle() {
        android.app.NotificationManager manager = context.getSystemService(android.app.NotificationManager.class);
        for (android.service.notification.StatusBarNotification item : manager.getActiveNotifications())
            if (item.getId() == 1) return item.getNotification().extras.getString(android.app.Notification.EXTRA_TEXT);
        return "";
    }
    private <T> T get(java.util.concurrent.Callable<T> action) {
        AtomicReference<T> result = new AtomicReference<>();
        main(() -> { try { result.set(action.call()); } catch (Exception error) { throw new RuntimeException(error); } });
        return result.get();
    }
    private ExoPlayer player(int id) throws Exception {
        Field field = PlaybackService.class.getDeclaredField("players");
        field.setAccessible(true);
        Object channel = ((Map<?, ?>) field.get(null)).get(id);
        Field player = channel.getClass().getDeclaredField("player");
        player.setAccessible(true);
        return (ExoPlayer) player.get(channel);
    }
    private void writeWave(File file) throws IOException {
        int samples = 44100 * 30;
        ByteBuffer bytes = ByteBuffer.allocate(44 + samples * 2).order(ByteOrder.LITTLE_ENDIAN);
        bytes.put(new byte[]{'R','I','F','F'}).putInt(36 + samples * 2).put(new byte[]{'W','A','V','E','f','m','t',' '}).putInt(16)
            .putShort((short)1).putShort((short)1).putInt(44100).putInt(88200).putShort((short)2).putShort((short)16)
            .put(new byte[]{'d','a','t','a'}).putInt(samples * 2);
        for (int i = 0; i < samples; i++) bytes.putShort((short)(Math.sin(i * 2 * Math.PI * 440 / 44100) * 512));
        try (FileOutputStream output = new FileOutputStream(file)) { output.write(bytes.array()); }
    }
}
