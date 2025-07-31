import { Button } from "@/components/ui/button";
import UploadFile from "@/components/upload-file";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="">
      <div className=" w-full flex flex-col gap-3 items-center mb-6">
        <h1 className=" text-center text-5xl font-semibold">CyberXplore Assignment</h1>
        <p className=" text-center text-primary/70">Securely upload files and scan malware, checkout files status </p>
        <Link href="/dashboard" >
          <Button
              className=" w-[120px] cursor-pointer bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
          >Dashboard</Button>
        </Link>
      </div>
      <div className=" w-full flex items-center justify-center">
        <UploadFile />
      </div>
      <footer className=" row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <p>Created by: <span className=" font-semibold text-green-400">Mohammad Ashfaq</span></p>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Github →
        </a>
      </footer>
    </div>
  );
}
