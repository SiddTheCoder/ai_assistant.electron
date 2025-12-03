import Header from "@/components/local/Header";
import CenterPanel from "@/components/local/home/CenterPanel";
import LeftPanel from "@/components/local/home/LeftPanel";
import RightPanel from "@/components/local/home/RightPanel";
import { useAiResponseHandler } from "@/hooks/useAiResponseHandler";

function Home() {
  useAiResponseHandler({
    autoListen: true,
    onSuccess(response, payload) {
      console.log("Action completed successfully!");
    },
    onError(error, payload) {
      console.error("Action failed:", error);
    }
  })

  return (
    <div className="h-screen w-screen bg-[#070818] text-white overflow-hidden">
      <Header />
      <div className="w-full h-full flex justify-between">
        <div className="h-full lg:w-[300px] w-60">
          <LeftPanel />
        </div>
        <div className="h-full flex-1 border-r border-l border-white/5">
          <CenterPanel />
        </div>
        <div className="h-full lg:w-[300px] w-60">
          <RightPanel />
        </div>
      </div>
    </div>
  );
}

export default Home;
