import { useSelector } from "react-redux";
import Link from "next/link";
import CategoryBtn from "@/components/common/btns/categoryBtn";
import PageTitle from "@/components/common/pageTitle";

export default function WorkspaceIndex() {
  const { jobs, currentStation } = useSelector((state) => state.workstation);

  if (!jobs || !Array.isArray(jobs)) {
    return <div className="text-black text-xl">正在載入工作站設定…</div>;
  }
  return (
    <>
      <div className="flex-1 flex justify-center items-center gap-50">
        {jobs.map((job) => (
          <Link key={job.key} href={job.path}>
            <CategoryBtn icon={job.icon} text={job.text} variant="darkGreen" />
          </Link>
        ))}
      </div>
    </>
  );
}
