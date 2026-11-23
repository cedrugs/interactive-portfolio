import { NeofetchData, ExperienceData } from './types';

export const neofetchData: NeofetchData = {
    username: 'guest',
    hostname: 'cedric-arch',
    os: 'Arch Linux x86_64',
    shell: 'zsh 5.9',
    terminal: 'web-terminal',
    cpu: 'AMD EPYC™ 9965',
    memory: '259 MiB / 122070 MiB',
    uptime: '96h 32m 16s',
};

export const experienceData: ExperienceData = {
	"Nutrisi AI": [{
		position: "Co-Founder & Chief Technical Officer",
		period: "Jun 2026 - Present",
		description: "Owns end-to-end mobile, backend and billing engineering; develops and fine-tunes AI models; architects Kubernetes infrastructure.",
	}],
	"Pelajarin AI": [{
		position: "Founder & Chief Technical Officer",
		period: "Jul 2025 - Present",
		description: "Scaled the learning platform to 1.2 million users, 10,000 daily active users and 20,000 peak concurrent users. Builds AI notes, flashcards, quizzes and a study assistant.",
	}],
	"PT DEWAWEB": [{
		position: "Junior Software Engineer",
		period: "May 2025 - Aug 2026",
		description: "Developed two production internal fullstack applications, documented DewaVPS APIs and contributed technical newsletter content.",
	}],
	"Fiverr": [{
		position: "Freelance Fullstack Developer",
		period: "Aug 2020 - 2024",
		description: "Delivered web projects, workflow automation and Discord bots with API integrations.",
	}],
	"Bina Nusantara Computer Club": [{
		position: "Research and Development Manager",
		period: "May 2025 - Present",
		description: "Modernizes legacy PHP deployments with Docker, microservices, CI/CD and centralized logging.",
	}],
	"BINUS Student Learning Community": [{
		position: "IT Development Activist",
		period: "Dec 2024 - Present",
		description: "Contributed frontend development to the Study2Challenge Hackathon website.",
	}],
	"Ureeka BINUS": [{
		position: "Member",
		period: "Oct 2024 - Present",
		description: "",
	}],
};

export const portfolioStack = {
	"Languages": [
		"TypeScript",
		"JavaScript",
		"Python",
		"Go",
		"PHP",
		"SQL"
	],
	"Web & mobile": [
		"React",
		"Next.js",
		"React Native",
		"Expo",
		"Vite",
		"Tailwind CSS"
	],
	"Servers & APIs": [
		"Node.js",
		"Bun",
		"Fastify",
		"FastAPI",
		"Hono",
		"Laravel"
	],
	"Data": [
		"PostgreSQL",
		"Redis",
		"Drizzle",
		"Prisma",
		"SQLAlchemy",
		"MariaDB"
	],
	"AI & machine learning": [
		"PyTorch",
		"Scikit-learn",
		"Gradio"
	],
	"Infrastructure": [
		"Docker",
		"Kubernetes",
		"Linux",
		"GitHub Actions",
		"GitLab CI/CD",
		"Traefik",
		"Nginx"
	]
};

export const techStackData = {
	languages: portfolioStack.Languages,
	frontend: portfolioStack['Web & mobile'],
	backend: [...portfolioStack['Servers & APIs'], ...portfolioStack.Data],
	tools: [...portfolioStack['AI & machine learning'], ...portfolioStack.Infrastructure],
};

export const aboutData = {
	name: "Technology Founder & Software Engineer",
	tagline: "Building technology, dreaming of a farm",
	bio: "I’m Sam, a Computer Science undergraduate at Binus University and a technology founder working across fullstack engineering, AI systems and cloud infrastructure. I’m the co-founder and CTO of Nutrisi AI and founder and CTO of Pelajarin AI.\n\nI love building useful technology, but I’ve always wanted a farm, too. Sam’s Valley imagines both lives together: writing code, growing food and making time for a more traditional way of living.",
	education: "B.Sc. in Computer Science, Binus University · 2024–Present.",
};

export const projectsData = [
	{
		"name": "Nutrisi AI",
		"icon": "salad",
		"description": "An AI nutrition companion that turns meal photos into calorie and macro estimates. Built across a mobile app, backend, billing, and an operator dashboard.",
		"tech": [
			"React Native",
			"Expo",
			"TypeScript",
			"Python",
			"FastAPI",
			"PostgreSQL",
			"Kubernetes"
		],
		"link": "https://nutrisi.ai"
	},
	{
		"name": "pelajarin.ai",
		"icon": "book-open",
		"description": "An AI learning platform with 1.2 million users. Turns study materials into notes, flashcards, and quizzes, with a study assistant and mobile learning experience.",
		"tech": [
			"React",
			"Expo",
			"Fastify",
			"Drizzle",
			"PostgreSQL",
			"Redis",
			"Python"
		],
		"link": "https://pelajarin.ai"
	},
	{
		"name": "RelayOn",
		"icon": "network",
		"description": "A unified AI gateway and marketplace for text, document, and audio services. Includes provider routing, API key management, usage tracking, and a management dashboard.",
		"tech": [
			"TypeScript",
			"Hono",
			"React",
			"Drizzle",
			"PostgreSQL",
			"Redis"
		],
		"link": "https://relayon.app"
	},
	{
		"name": "Bitora",
		"icon": "terminal",
		"description": "A gamified C programming platform with interactive lessons, an in-browser coding terminal, XP, and leaderboards. Code runs in isolated Docker containers through a Go backend.",
		"tech": [
			"Go",
			"React",
			"TypeScript",
			"Vite",
			"PostgreSQL",
			"Docker"
		],
		"link": ""
	},
	{
		"name": "samjourn.al",
		"icon": "notebook-pen",
		"description": "A quiet personal journal for everyday reflections and quiet time entries, with rich text editing and optional audio attachments.",
		"tech": [
			"React",
			"TypeScript",
			"Fastify",
			"Bun",
			"Drizzle",
			"PostgreSQL"
		],
		"link": "https://samjourn.al"
	},
	{
		"name": "Tensorcode",
		"icon": "blocks",
		"description": "A bilingual software studio website with prerendered pages, motion, and a companion API for contact and newsletter forms.",
		"tech": [
			"React",
			"TypeScript",
			"Vite",
			"Tailwind CSS",
			"Hono",
			"Drizzle"
		],
		"link": "https://tensorcode.co.id"
	},
	{
		"name": "GiziTrack",
		"icon": "utensils",
		"description": "A meal delivery dashboard with tracking, notifications, and a React interface backed by Laravel.",
		"tech": [
			"Laravel",
			"MariaDB",
			"TypeScript",
			"Docker",
			"React",
			"Vite",
			"Tailwind CSS",
			"Nginx"
		],
		"link": "https://github.com/Cedrugs/gizitrack"
	},
	{
		"name": "Chatguard",
		"icon": "shield-check",
		"description": "Toxic language detection using a fine-tuned XLM-RoBERTa model, exposed through a FastAPI service and Gradio interface.",
		"tech": [
			"Scikit-learn",
			"PyTorch",
			"FastAPI",
			"Docker",
			"Gradio"
		],
		"link": "https://github.com/Cedrugs/Chatguard-API"
	},
	{
		"name": "streakinator",
		"icon": "git-commit-horizontal",
		"description": "An interactive Go command-line utility for creating backdated, empty Git commits.",
		"tech": [
			"Go"
		],
		"link": "https://github.com/Cedrugs/streakinator"
	}
];

export const contactData = {
    email: 'contact@samuelcedric.com',
    github: 'github.com/Cedrugs',
    linkedin: 'linkedin.com/in/samuel-cedric',
    twitter: 'twitter.com/Cedrugs_',
    website: 'samuelcedric.com',
};
