import { useEffect, useState, useSyncExternalStore } from "react";
import { detectInAppBrowser, isAndroidDevice, isIOSDevice } from "@/lib/device";

// 크롬·엣지·삼성 인터넷이 "설치할 수 있어요"라고 알려 주는 이벤트. 표준 타입에 없어 직접 정의한다.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    // 브라우저 기본 안내 대신, 우리 버튼을 눌렀을 때 설치 창을 띄운다.
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** 이미 홈 화면 아이콘으로 열린 상태인지 */
export function isRunningAsApp() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export type InstallPlatform = "ios" | "android" | "desktop";

export type InstallState = {
  /** 화면에 그려도 되는지 (서버 렌더링 중에는 false) */
  ready: boolean;
  /** 이미 앱으로 열려 있음 → 버튼 숨김 */
  installed: boolean;
  /** 카카오톡 등 앱 안 브라우저 → 설치 불가, 크롬/사파리로 열어야 함 */
  inAppBrowser: boolean;
  /** 버튼 한 번으로 설치 창을 띄울 수 있음 (안드로이드·PC 크롬 등) */
  canPrompt: boolean;
  platform: InstallPlatform;
};

export function useInstallApp() {
  const prompt = useSyncExternalStore(
    subscribe,
    () => deferredPrompt,
    () => null,
  );
  const [env, setEnv] = useState({
    ready: false,
    installed: false,
    inAppBrowser: false,
    platform: "desktop" as InstallPlatform,
  });

  useEffect(() => {
    const platform: InstallPlatform = isIOSDevice()
      ? "ios"
      : isAndroidDevice()
        ? "android"
        : "desktop";
    setEnv({
      ready: true,
      installed: isRunningAsApp(),
      inAppBrowser: !!detectInAppBrowser(),
      platform,
    });
    const onInstalled = () => setEnv((s) => ({ ...s, installed: true }));
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  /** 설치 창을 띄운다. 띄울 수 없으면 false (→ 직접 추가하는 방법 안내) */
  const install = async (): Promise<boolean> => {
    const p = deferredPrompt;
    if (!p) return false;
    await p.prompt();
    await p.userChoice.catch(() => undefined);
    // 한 번 쓴 이벤트는 다시 쓸 수 없다.
    deferredPrompt = null;
    notify();
    return true;
  };

  const state: InstallState = { ...env, canPrompt: !!prompt };
  return { ...state, install };
}
