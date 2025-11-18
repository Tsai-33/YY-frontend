import { useSelector, useDispatch } from "react-redux";
import Link from "next/link";
import { setCurrentJob } from "@/redux/reducer/reducerWorkStations";
import CategoryBtn from "@/components/common/btns/categoryBtn";
import PageTitle from "@/components/common/pageHeader/pageTitle";

export default function WorkspaceIndex() {
  const dispatch = useDispatch();
  const { jobs, currentStation } = useSelector((state) => state.workstation);

  if (!jobs || !Array.isArray(jobs)) {
    return <div className="text-black text-xl">正在載入工作站設定…</div>;
  }

  const handleSelectJob = (job) => {
    dispatch(setCurrentJob(job));
  };
  return (
    <>
      <div className="flex-1 flex justify-center items-center gap-50">
        {jobs.map((job) => (
          <Link
            key={job.key}
            href={job.path}
            onClick={() => handleSelectJob(job.text)}>
            <CategoryBtn icon={job.icon} text={job.text} variant="darkGreen" />
          </Link>
        ))}
      </div>
    </>
  );
}
