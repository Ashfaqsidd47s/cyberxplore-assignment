/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Ban, CircleCheck, CircleQuestionMark, CircleQuestionMarkIcon, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from 'date-fns';

type FileData = {
  id: string;
  file_name: string;
  path: string;
  status: string;
  result: string;
  uploaded_at: string;
  scanned_at: string;
};

export default function Dashboard() {
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const [files, setFiles] = useState<Array<FileData>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API_URL}/files`);
      if (!res.data || res.data?.length <= 0) {
        return;
      }
      const data = res.data.map((item: any) => {
        const update_date = formate_date(item.createdAt);
        const scan_date = formate_date(item.scannedAt);
        return {
          id: item.id,
          file_name: item?.filename || "--",
          path: item?.path || "",
          status: item?.status || "--",
          result: item?.result || "--",
          uploaded_at: update_date || "--",
          scanned_at: scan_date || "--",
        };
      });
      setFiles(data);
    } catch (error) {
      toast.error("Error while fetching files try again...");
    }
  };

  const formate_date = (data: string) => {
    if(!data || data.trim() == ""){
      return "--";
    }
    return format(new Date(data), 'dd/MM/yyyy | HH:mm:ss')
  }

  useEffect(() => {
    fetchFiles(); // Initial fetch
    const intervalId = setInterval(fetchFiles, 5000); // Fetch every 5 seconds

    return () => clearInterval(intervalId); 
  },[] );

  // Filter and search logic
  const filteredFiles = files.filter((file) => {
    const matchesSearch = (
      file.file_name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      file.uploaded_at.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      file.status.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      file.scanned_at.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      file.result.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

    const matchesStatus = statusFilter === "all" || file.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesResult = resultFilter === "all" || file.result.toLowerCase() === resultFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesResult;
  });


  return (
    <div className="p-5">
      <div className=" py-4 flex items-center justify-end">
        <Link href="/" >
          <Button
              className=" w-[120px] cursor-pointer bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
          >Upload file</Button>
        </Link>
      </div>
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="scanned">Scanned</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="--">--</SelectItem>
            <SelectItem value="infected">Infected</SelectItem>
            <SelectItem value="clean">Clean</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableCaption>A list of your recent files.</TableCaption>
        <TableHeader className="bg-card">
          <TableRow>
            <TableHead className=" pl-5">File Name</TableHead>
            <TableHead>Uploaded At</TableHead>
            <TableHead className=" text-center">Status</TableHead>
            <TableHead>Scanned At</TableHead>
            <TableHead className=" text-center ">Result</TableHead>
            <TableHead className=" w-[100px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className=" border-b">
          {filteredFiles.map((file) => (
            <TableRow key={file.id}>
              <TableCell className="font-medium pl-5">{file.file_name}</TableCell>
              <TableCell>{file.uploaded_at}</TableCell>
              <TableCell className=" text-center">
                {file.status == "--" ? "--" 
                : <div className=" flex items-center justify-center">
                    <Badge 
                      variant="outline" 
                      className={` flex items-center justify-center gap-1 uppercase font-semibold 
                         ${file.status == "scanned" ? ' bg-green-200/20 text-green-500':
                          file.status == "pending" ? ' bg-yellow-200/20 text-yellow-500':
                         'bg-red-200/20 text-red-500'}`
                        }
                    >
                      {file.status == "scanned" ?<CircleCheck /> : file.status == "pending" ? <CircleQuestionMarkIcon /> : <Ban />}
                      {file.status}
                    </Badge>
                  </div>
                }
              </TableCell>
              <TableCell>{file.scanned_at}</TableCell>
              <TableCell className=" text-center">
                {file.result == "clean" || file.result == "infected" ? 
                  <div className=" flex items-center justify-center">
                    <Badge 
                      variant="outline" 
                      className={` flex items-center justify-center gap-1 uppercase font-semibold  ${file.result == "clean" ? ' bg-green-200/20 text-green-500': 'bg-red-200/20 text-red-500'}`}
                    >
                      {file.result == "clean" ?<CircleCheck /> : <CircleQuestionMark />}
                      {file.result}
                    </Badge>
                  </div>: file.result
                }
              </TableCell>
              <TableCell>
                <a
                  href={file.path}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}