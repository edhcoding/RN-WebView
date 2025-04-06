import { useRouter } from "next/router";
import { useCallback } from "react";

const Header = ({ title }: { title: string }) => {
  const router = useRouter();
  const onPressBackButton = useCallback(() => {
    router.back();
  }, [router]);
  return (
    <div className="h-44 flex items-center">
      <div className="flex flex-1">
        <button className="ml-20" onClick={onPressBackButton}>
          <span className="material-icons text-title text-24">
            arrow_back_ios
          </span>
        </button>
      </div>
      <div className="flex flex-1 justify-center">
        <span className="text-15 font-semibold text-title">{title}</span>
      </div>
      <div className="flex flex-1"></div>
    </div>
  );
};

export default Header;
