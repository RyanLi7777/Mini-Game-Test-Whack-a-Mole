// 入口：注册场景、启动引擎。
import { Game } from "./game.js";
import { BootScene } from "./scenes/boot.js";
import { MenuScene } from "./scenes/menu.js";
import { SettingsScene } from "./scenes/settings.js";
import { LevelSelectScene } from "./scenes/levelselect.js";
import { LevelScene } from "./scenes/level.js";
import { ResultScene } from "./scenes/result.js";
import { CompleteScene } from "./scenes/complete.js";

const canvas = document.getElementById("game");

Game.register("boot", BootScene);
Game.register("menu", MenuScene);
Game.register("settings", SettingsScene);
Game.register("levelselect", LevelSelectScene);
Game.register("level", LevelScene);
Game.register("result", ResultScene);
Game.register("complete", CompleteScene);

Game.start(canvas);
Game.changeScene("boot");
