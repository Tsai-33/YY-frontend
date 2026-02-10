import { useSelector, useDispatch } from "react-redux";
import { setCurrentJob } from "@/redux/reducer/reducerWorkStations";
import CategoryBtn from "@/components/common/btns/categoryBtn";
import { useRouter } from "next/router";
import { selectTask } from "@/components/taskFunction";
import Alert from "@/components/common/alert/alert";

export default function WorkspaceIndex() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { jobs, stations, currentStation } = useSelector(
    (state) => state.workstation,
  );
  if (!jobs || !Array.isArray(jobs)) {
    return <div className="text-black text-xl">正在載入工作站設定…</div>;
  }

  const handleSelectJob = async (job) => {
    // 檢查任務
    const task = await selectTask({ stations: stations[0] });
    if (task?.success) {
      const hasTask = task?.data?.data?.some(
        (item) => item.location === job.key || item.location === "",
      );
      if (hasTask || job.key === "stockQuery" || job.key === "inboundRemote") {
        // job.key
        dispatch(setCurrentJob(job.text));
        router.push(job.path);
      } else {
        Alert({ title: "有其他項目正在進行中..." });
      }
    }
  };
  return (
    <>
      <div className="flex-1 flex justify-around items-center ">
        {jobs.map((job) => (
          <CategoryBtn
            key={job.key}
            icon={job.icon}
            text={job.text}
            variant="darkGreen"
            onClick={() => handleSelectJob(job)}
          />
        ))}
      </div>
    </>
  );
}
