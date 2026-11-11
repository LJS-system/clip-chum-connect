import { useState, type ReactNode } from "react";
import {
  Copy,
  Download,
  EllipsisVertical,
  ExternalLink,
  Share,
  Smartphone,
  SquarePlus,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { openInExternalBrowser } from "@/lib/device";
import { useInstallApp, type InstallPlatform } from "@/lib/pwa-install";

/** 마이페이지의 "앱으로 설치하기" 카드. 이미 앱으로 열려 있으면 보이지 않는다. */
export function InstallAppCard() {
  const { ready, installed, inAppBrowser, canPrompt, platform, install } = useInstallApp();
  const [guideOpen, setGuideOpen] = useState(false);

  if (!ready || installed) return null;

  const onInstall = async () => {
    const shown = await install();
    if (!shown) setGuideOpen(true);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      toast.success("주소를 복사했어요. Safari에 붙여넣어 열어 주세요.");
    } catch {
      toast.error("복사에 실패했어요. 주소창을 길게 눌러 복사해 주세요.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" /> 앱으로 설치하기
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          홈 화면에 아이콘을 만들어 두면 주소창 없이 앱처럼 바로 열 수 있어요.
        </p>

        {inAppBrowser ? (
          <>
            <p className="rounded-md bg-muted px-3 py-2 leading-relaxed">
              카카오톡 같은 앱 안에서는 설치할 수 없어요. {platform === "ios" ? "Safari" : "크롬"}
              으로 열어서 다시 눌러 주세요.
            </p>
            {platform === "android" ? (
              <Button onClick={() => openInExternalBrowser()} className="w-full sm:w-auto">
                <ExternalLink className="h-4 w-4" /> 크롬으로 열기
              </Button>
            ) : (
              <Button onClick={copyLink} variant="outline" className="w-full sm:w-auto">
                <Copy className="h-4 w-4" /> 주소 복사
              </Button>
            )}
          </>
        ) : (
          <Button onClick={onInstall} className="w-full sm:w-auto">
            <Download className="h-4 w-4" /> {canPrompt ? "앱 설치" : "설치 방법 보기"}
          </Button>
        )}
      </CardContent>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>홈 화면에 추가하는 방법</DialogTitle>
            <DialogDescription>순서대로 따라 하면 홈 화면에 아이콘이 생겨요.</DialogDescription>
          </DialogHeader>
          <InstallGuide platform={platform} />
          <Button onClick={() => setGuideOpen(false)} className="w-full">
            확인
          </Button>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function InstallGuide({ platform }: { platform: InstallPlatform }) {
  if (platform === "ios") {
    return (
      <ol className="space-y-3 text-sm">
        <Step n={1}>
          Safari 화면의{" "}
          <Chip>
            <Share className="h-3.5 w-3.5" /> 공유
          </Chip>{" "}
          버튼을 눌러요.
          <span className="mt-1 block text-xs text-muted-foreground">
            공유 버튼이 안 보이면 <Chip>⋯</Chip> 버튼을 먼저 눌러요.
          </span>
        </Step>
        <Step n={2}>
          목록을 아래로 내려{" "}
          <Chip>
            <SquarePlus className="h-3.5 w-3.5" /> 홈 화면에 추가
          </Chip>
          를 눌러요.
        </Step>
        <Step n={3}>
          오른쪽 위 <Chip>추가</Chip>를 누르면 끝이에요.
        </Step>
      </ol>
    );
  }
  if (platform === "android") {
    return (
      <ol className="space-y-3 text-sm">
        <Step n={1}>
          크롬 오른쪽 위{" "}
          <Chip>
            <EllipsisVertical className="h-3.5 w-3.5" />
          </Chip>{" "}
          메뉴를 눌러요.
        </Step>
        <Step n={2}>
          <Chip>홈 화면에 추가</Chip> 또는 <Chip>앱 설치</Chip>를 눌러요.
        </Step>
        <Step n={3}>
          <Chip>설치</Chip> 또는 <Chip>추가</Chip>를 누르면 끝이에요.
        </Step>
      </ol>
    );
  }
  return (
    <ol className="space-y-3 text-sm">
      <Step n={1}>
        크롬이나 엣지에서 주소창 오른쪽의{" "}
        <Chip>
          <Download className="h-3.5 w-3.5" /> 설치
        </Chip>{" "}
        아이콘을 눌러요.
      </Step>
      <Step n={2}>
        아이콘이 없으면 오른쪽 위{" "}
        <Chip>
          <EllipsisVertical className="h-3.5 w-3.5" />
        </Chip>{" "}
        메뉴에서 <Chip>앱 설치</Chip>를 찾아 눌러요.
      </Step>
    </ol>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {n}
      </span>
      <div className="pt-0.5 leading-relaxed">{children}</div>
    </li>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="mx-0.5 inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 align-middle text-xs font-medium">
      {children}
    </span>
  );
}
