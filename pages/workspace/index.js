import { useSelector, useDispatch } from "react-redux";
import { setCurrentJob } from "@/redux/reducer/reducerWorkStations";
import CategoryBtn from "@/components/common/btns/categoryBtn";
import { useRouter } from "next/router";

export default function WorkspaceIndex() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { jobs, currentStation } = useSelector((state) => state.workstation);

  if (!jobs || !Array.isArray(jobs)) {
    return <div className="text-black text-xl">正在載入工作站設定…</div>;
  }

  const handleSelectJob = (job) => {
    dispatch(setCurrentJob(job.text));
    router.push(job.path);
  };
  return (
    <>
      <div className="flex-1 flex justify-center items-center gap-50">
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
