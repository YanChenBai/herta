import "@nativescript/core/globals";
import { createApp, registerElement } from "nativescript-vue";
import { Video } from "./player/video";
import { configureAudioSession } from "./player/audio-session";
import App from "./App.vue";
import "./app.css";

registerElement("VideoPlayer", () => Video);
configureAudioSession();
createApp(App).start();
