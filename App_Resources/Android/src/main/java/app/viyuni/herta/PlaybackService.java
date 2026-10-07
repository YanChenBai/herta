package app.viyuni.herta;

import android.app.*;
import android.content.*;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.media.MediaMetadata;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.os.*;
import android.view.TextureView;
import androidx.media3.common.*;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.datasource.DefaultDataSource;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import java.util.*;

/** 播放器属于服务，Surface 的销毁不结束音频播放。所有入口由主线程调用。 */
public final class PlaybackService extends Service {
    private static final String CHANNEL = "herta.playback";
    private static final Map<Integer, Channel> players = new HashMap<>();
    private static final Map<Integer, TextureView> views = new HashMap<>();
    private static final Map<Integer, android.view.View.OnLayoutChangeListener> layouts = new HashMap<>();
    private static final Set<Integer> cancelled = new HashSet<>();
    private static final Map<Integer, String> errors = new HashMap<>();
    private static PlaybackService instance;
    private static String workspaceName = "我的工作台";
    private MediaSession session;
    private Bitmap logo;
    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;
    private boolean hasFocus;
    private boolean interrupted;
    private boolean userPaused;
    private boolean notificationPlaying;
    private float duck = 1f;

    private static final class Channel {
        final ExoPlayer player;
        float volume;
        String error = "";
        Channel(ExoPlayer player, float volume) { this.player = player; this.volume = volume; }
    }

    public static void setWorkspaceName(String name) {
        String next = name == null || name.trim().isEmpty() ? "我的工作台" : name.trim();
        if (next.equals(workspaceName)) return;
        workspaceName = next;
        if (instance != null) instance.notifyPlayback(instance.notificationPlaying);
    }

    public static void prepare(Context context, int id, String url, String headers, float volume) {
        cancelled.remove(id);
        errors.remove(id);
        Intent intent = new Intent(context, PlaybackService.class).putExtra("id", id)
            .putExtra("url", url).putExtra("headers", headers).putExtra("volume", volume);
        if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent);
        else context.startService(intent);
    }
    public static void attach(int id, TextureView view) {
        detach(id);
        views.put(id, view);
        android.view.View.OnLayoutChangeListener listener = (v, l, t, r, b, oldL, oldT, oldR, oldB) -> fitVideo(id);
        layouts.put(id, listener);
        view.addOnLayoutChangeListener(listener);
        Channel channel = players.get(id);
        if (channel != null) channel.player.setVideoTextureView(view);
        fitVideo(id);
    }
    public static void detach(int id) {
        TextureView view = views.remove(id);
        android.view.View.OnLayoutChangeListener listener = layouts.remove(id);
        if (view != null && listener != null) view.removeOnLayoutChangeListener(listener);
        Channel channel = players.get(id);
        if (channel != null && view != null) channel.player.clearVideoTextureView(view);
    }
    private static void fitVideo(int id) {
        TextureView view = views.get(id);
        Channel channel = players.get(id);
        if (view == null || channel == null || view.getWidth() == 0 || view.getHeight() == 0) return;
        VideoSize size = channel.player.getVideoSize();
        if (size.width == 0 || size.height == 0) return;
        float videoRatio = size.width * size.pixelWidthHeightRatio / size.height;
        float viewRatio = (float) view.getWidth() / view.getHeight();
        android.graphics.Matrix matrix = new android.graphics.Matrix();
        matrix.setScale(Math.min(1, videoRatio / viewRatio), Math.min(1, viewRatio / videoRatio), view.getWidth() / 2f, view.getHeight() / 2f);
        view.setTransform(matrix);
    }
    public static void volume(int id, float volume) {
        Channel channel = players.get(id);
        if (channel == null) return;
        channel.volume = Math.max(0, Math.min(1, volume));
        channel.player.setVolume(channel.volume * (instance == null ? 1 : instance.duck));
    }
    public static boolean ready(int id) {
        Channel channel = players.get(id);
        return channel != null && channel.player.getPlaybackState() == Player.STATE_READY;
    }
    public static boolean buffering(int id) {
        Channel channel = players.get(id);
        return channel != null && channel.player.getPlaybackState() == Player.STATE_BUFFERING;
    }
    public static String error(int id) {
        Channel channel = players.get(id);
        return channel == null ? errors.getOrDefault(id, "") : channel.error;
    }
    public static void release(int id) {
        detach(id);
        Channel channel = players.remove(id);
        errors.remove(id);
        if (channel == null) cancelled.add(id);
        if (channel != null) channel.player.release();
        if (instance != null) {
            if (players.isEmpty()) instance.stopSelf();
            else instance.notifyPlayback(instance.notificationPlaying);
        }
    }
    public static void pause(int id) {
        Channel channel = players.get(id);
        if (channel != null) channel.player.pause();
    }
    public static void play(int id) {
        Channel channel = players.get(id);
        if (channel != null && instance != null && instance.hasFocus && !instance.interrupted) channel.player.play();
    }

    @Override public void onCreate() {
        super.onCreate();
        instance = this;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(new NotificationChannel(CHANNEL, "直播播放", NotificationManager.IMPORTANCE_LOW));
        }
        session = new MediaSession(this, "Herta");
        Drawable icon = getResources().getDrawable(getApplicationInfo().icon, getTheme());
        logo = Bitmap.createBitmap(128, 128, Bitmap.Config.ARGB_8888);
        icon.setBounds(0, 0, 128, 128);
        icon.draw(new Canvas(logo));
        session.setCallback(new MediaSession.Callback() {
            @Override public void onPlay() { resumeAll(); }
            @Override public void onPause() { pauseAll(); }
            @Override public void onStop() { stopSelf(); }
        });
        session.setActive(true);
        // 必须先进入前台，再请求音频焦点与加载直播。
        notifyPlayback(true);
        audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);
        AudioManager.OnAudioFocusChangeListener listener = change -> {
            if (change == AudioManager.AUDIOFOCUS_GAIN) {
                hasFocus = true;
                duck = 1;
                for (Channel channel : players.values()) channel.player.setVolume(channel.volume);
                if (interrupted) { interrupted = false; if (!userPaused) resumeAll(); }
            } else if (change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
                duck = .2f;
                for (Channel channel : players.values()) channel.player.setVolume(channel.volume * duck);
            } else {
                hasFocus = false;
                interrupted = change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT;
                for (Channel channel : players.values()) channel.player.pause();
                notifyPlayback(false);
            }
        };
        if (Build.VERSION.SDK_INT >= 26) {
            focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).build())
                .setOnAudioFocusChangeListener(listener).build();
            hasFocus = audioManager.requestAudioFocus(focusRequest) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        } else hasFocus = audioManager.requestAudioFocus(listener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        legacyFocusListener = listener;
    }
    private AudioManager.OnAudioFocusChangeListener legacyFocusListener;

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) { stopSelf(); return START_NOT_STICKY; }
        String action = intent.getAction();
        if ("stop".equals(action)) { stopSelf(); return START_NOT_STICKY; }
        if ("pause".equals(action)) { pauseAll(); return START_NOT_STICKY; }
        if ("play".equals(action)) { resumeAll(); return START_NOT_STICKY; }
        int id = intent.getIntExtra("id", -1);
        if (cancelled.remove(id)) { if (players.isEmpty()) stopSelf(); return START_NOT_STICKY; }
        try {
            Map<String, String> headers = new HashMap<>();
            org.json.JSONObject json = new org.json.JSONObject(intent.getStringExtra("headers"));
            Iterator<String> keys = json.keys();
            while (keys.hasNext()) { String key = keys.next(); headers.put(key, json.getString(key)); }
            DefaultHttpDataSource.Factory http = new DefaultHttpDataSource.Factory().setDefaultRequestProperties(headers);
            ExoPlayer player = new ExoPlayer.Builder(this).setMediaSourceFactory(new DefaultMediaSourceFactory(new DefaultDataSource.Factory(this, http)))
                .setWakeMode(C.WAKE_MODE_NETWORK).setHandleAudioBecomingNoisy(true).build();
            Channel channel = new Channel(player, intent.getFloatExtra("volume", 0));
            Channel old = players.put(id, channel);
            if (old != null) old.player.release();
            player.setVolume(channel.volume * duck);
            player.addListener(new Player.Listener() {
                @Override public void onPlayerError(PlaybackException error) { channel.error = error.getErrorCodeName(); }
                @Override public void onVideoSizeChanged(VideoSize size) { fitVideo(id); }
            });
            if (views.containsKey(id)) player.setVideoTextureView(views.get(id));
            player.setMediaItem(MediaItem.fromUri(intent.getStringExtra("url")));
            player.prepare();
            player.setPlayWhenReady(hasFocus && !interrupted && !userPaused);
            notifyPlayback(hasFocus && !interrupted && !userPaused);
        } catch (Exception error) {
            android.util.Log.e("HertaPlayback", "Cannot prepare player", error);
            Channel channel = players.get(id);
            if (channel != null) channel.error = "播放初始化失败";
            else errors.put(id, "播放初始化失败");
            if (players.isEmpty()) stopSelf();
        }
        return START_NOT_STICKY;
    }
    private void pauseAll() {
        userPaused = true;
        for (Channel channel : players.values()) channel.player.pause();
        notifyPlayback(false);
    }
    private void resumeAll() {
        if (!hasFocus && Build.VERSION.SDK_INT >= 26) hasFocus = audioManager.requestAudioFocus(focusRequest) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        else if (!hasFocus) hasFocus = audioManager.requestAudioFocus(legacyFocusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        if (!hasFocus) return;
        interrupted = false;
        userPaused = false;
        for (Channel channel : players.values()) channel.player.play();
        notifyPlayback(true);
    }
    private PendingIntent command(String action) {
        return PendingIntent.getService(this, action.hashCode(), new Intent(this, PlaybackService.class).setAction(action), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    private void notifyPlayback(boolean playing) {
        notificationPlaying = playing;
        String subtitle = workspaceName + " · " + players.size() + " 个直播间";
        session.setMetadata(new MediaMetadata.Builder()
            .putString(MediaMetadata.METADATA_KEY_TITLE, "黑塔 Herta")
            .putString(MediaMetadata.METADATA_KEY_ARTIST, subtitle)
            .putString(MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE, subtitle)
            .putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, logo)
            .putBitmap(MediaMetadata.METADATA_KEY_DISPLAY_ICON, logo).build());
        session.setPlaybackState(new PlaybackState.Builder().setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_STOP)
            .setState(playing ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED, PlaybackState.PLAYBACK_POSITION_UNKNOWN, playing ? 1 : 0).build());
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        builder.setSmallIcon(getResources().getIdentifier("ic_stat_live", "drawable", getPackageName()))
            .setLargeIcon(logo).setContentTitle("黑塔 Herta")
            .setContentText(subtitle).setOngoing(true)
            .setContentIntent(PendingIntent.getActivity(this, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE))
            .addAction(playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play, playing ? "暂停" : "播放", command(playing ? "pause" : "play"))
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "停止", command("stop"))
            .setStyle(new Notification.MediaStyle().setMediaSession(session.getSessionToken()).setShowActionsInCompactView(0, 1));
        startForeground(1, builder.build());
    }
    @Override public void onDestroy() {
        for (Integer id : players.keySet()) errors.put(id, "播放已停止，请重新连接");
        for (Channel channel : players.values()) channel.player.release();
        players.clear();
        for (Integer id : new ArrayList<>(views.keySet())) detach(id);
        views.clear();
        cancelled.clear();
        if (audioManager != null) {
            if (Build.VERSION.SDK_INT >= 26 && focusRequest != null) audioManager.abandonAudioFocusRequest(focusRequest);
            else audioManager.abandonAudioFocus(legacyFocusListener);
        }
        session.release();
        instance = null;
        stopForeground(true);
        super.onDestroy();
    }
    @Override public IBinder onBind(Intent intent) { return null; }
}
