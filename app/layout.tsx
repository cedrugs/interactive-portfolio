import type { Metadata } from "next";
import { Cascadia_Mono } from 'next/font/google';
import { StructuredData } from '@/components/StructuredData';
import "./globals.css";

const cascadiaMono = Cascadia_Mono({
    subsets: ['latin'],
    variable: '--font-cascadia-mono',
});

export const metadata: Metadata = {
    title: "Samuel Cedric - Software Engineer & Full Stack Developer",
    description: "Junior Software Engineer at PT DEWAWEB specializing in Next.js, React, Go, and FastAPI. Interactive terminal portfolio showcasing projects, experience, and technical skills.",
    keywords: ["Samuel Cedric", "Software Engineer", "Full Stack Developer", "Next.js", "React", "Go", "FastAPI", "Portfolio", "Web Developer"],
    authors: [{ name: "Samuel Cedric" }],
    creator: "Samuel Cedric",
    publisher: "Samuel Cedric",
    robots: "index, follow",
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://samuelcedric.com",
        siteName: "Samuel Cedric Portfolio",
        title: "Samuel Cedric - Software Engineer & Full Stack Developer",
        description: "Junior Software Engineer at PT DEWAWEB specializing in Next.js, React, Go, and FastAPI. Interactive terminal portfolio showcasing projects, experience, and technical skills.",
        images: [
            {
                url: "https://samuelcedric.com/og-image.png",
                width: 1200,
                height: 630,
                alt: "Samuel Cedric - Software Engineer Portfolio",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Samuel Cedric - Software Engineer & Full Stack Developer",
        description: "Junior Software Engineer at PT DEWAWEB specializing in Next.js, React, Go, and FastAPI.",
        images: ["https://samuelcedric.com/og-image.png"],
    },
    alternates: {
        canonical: "https://samuelcedric.com",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <StructuredData />
            </head>
            <body className={`${cascadiaMono.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}
