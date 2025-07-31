import Link from "next/link";

import {  Ghost } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ModeToggle } from "./mode-toggle";

export default function Navbar() {
    return (
        <header className="fixed top-0 left-0 z-20 flex h-20 w-full shrink-0 items-center justify-between bg-black/20 px-4 backdrop-blur-xs md:px-6">
            <Link href="/" className="mr-6 flex items-center gap-3" >
                <Ghost />
                <span>Mohammad Ashfaq</span>
            </Link>
            
            <div className="flex items-center justify-center gap-3">
                <ModeToggle />
                <Link href="/dashboard" >
                    <Button
                        className=" w-[100px] cursor-pointer bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                    >Contact</Button>
                </Link>
            </div>
        </header>
    );
}
