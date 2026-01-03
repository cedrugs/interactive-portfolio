export function StructuredData() {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Samuel Cedric",
        "jobTitle": "Junior Software Engineer",
        "worksFor": {
            "@type": "Organization",
            "name": "PT DEWAWEB"
        },
        "url": "https://samuelcedric.com",
        "sameAs": [
            "https://github.com/cedrugs",
            "https://linkedin.com/in/samuel-cedric",
            "https://twitter.com/cedrugs_"
        ],
        "knowsAbout": [
            "Next.js",
            "React",
            "TypeScript",
            "Go",
            "FastAPI",
            "Docker",
            "PostgreSQL",
            "Full Stack Development"
        ],
        "alumniOf": "Bina Nusantara University",
        "email": "contact@samuelcedric.com"
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    );
}
