export function configureAudioSession() {
  const session = AVAudioSession.sharedInstance();
  if (
    !session.setCategoryWithOptionsError(
      AVAudioSessionCategoryPlayback,
      AVAudioSessionCategoryOptions.MixWithOthers,
    )
  )
    throw new Error("无法配置后台音频会话");
  if (!session.setActiveError(true)) throw new Error("无法启动音频会话");
}
