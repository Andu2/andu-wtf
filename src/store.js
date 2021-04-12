import { localStorageStore } from "./localstore";

export const distortion = localStorageStore("distortion", 0);
export const nextPlay = localStorageStore("nextPlay", Math.floor(Math.random() * 8) + 1);
