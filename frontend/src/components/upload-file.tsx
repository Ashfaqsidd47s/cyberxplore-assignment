"use client"
import { FileText, Upload, Loader2, FileImage } from 'lucide-react'
import React, { useState, useRef } from 'react'
import { Button } from './ui/button'
import { toast } from 'sonner'
import axios from 'axios'

export default function UploadFile() {
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const [isDragging, setIsDragging] = useState<boolean>(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState<boolean>(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const allowedTypes: string[] = ['.pdf', '.doc', '.docx', '.jpg', '.png']

    const isImageFile = (file: File | null): boolean => {
        if (!file) return false;
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ext === 'jpg' || ext === 'png';
      }
      
    
    const validateFileType = (file: File): boolean => {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
        return allowedTypes.includes(fileExtension)
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
        
        const file = e.dataTransfer.files[0]
        if (file) {
            if (validateFileType(file)) {
                setSelectedFile(file)
            } else {
                toast.error('Invalid file type. Please select a valid file format.')
            }
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (validateFileType(file)) {
                setSelectedFile(file)
            } else {
                toast.error('Invalid file type. Please select a valid file format.')
                e.target.value = '' // Reset input
            }
        }
    }

    const handleChooseFile = () => {
        fileInputRef.current?.click()
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("No file selected")
            return
        }

        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', selectedFile)

        try {
            await axios.post(`${API_URL}/files/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            toast.success(`Successfully uploaded ${selectedFile.name}`)
            setSelectedFile(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch (error) {
            toast.error(`Failed to upload ${selectedFile.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="max-w-2xl mb-16">
            <div className=" bg-card border-gray-800 backdrop-blur-sm rounded-xl">
                <div className="p-8">
                    <div
                        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
                            isDragging ? "border-blue-500 bg-popover" : "border-gray-700 hover:border-gray-600"
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {selectedFile ? (
                            <div className=" flex flex-col items-center ">
                                {isImageFile(selectedFile) ? (
                                    <FileImage className="w-16 h-16 text-green-400" />
                                ) : (
                                    <FileText className="w-16 h-16 text-blue-400" />
                                )}
                                <p className=" max-w-[250px] truncate">{selectedFile.name}</p>
                                <p className="text-gray-400 mb-6">Upload file to scan or chose other file</p>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Drop file here to scan</h3>
                                <p className="text-gray-400 mb-6">Or click to browse files. Supports PDF, DOC, DOCX, JPG, and PNG.</p>
                            </>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload"
                            accept={allowedTypes.join(',')}
                            disabled={isUploading}
                        />
                        <div className="flex justify-center gap-4">
                            <Button
                                variant="secondary"
                                onClick={handleChooseFile}
                                className=" w-[120px]"
                                disabled={isUploading}
                            >
                                {selectedFile ? "Change file" : "Choose File"}
                            </Button>
                            {selectedFile && (
                                <Button
                                    onClick={handleUpload}
                                    className=" w-[120px] cursor-pointer bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        </>
                                    ) : (
                                        'Upload File'
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}