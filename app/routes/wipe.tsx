import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

export const meta = () => ([
  {title: "Cognify | Wipe Resume"},
  {name: "description", content: "Delete all your resume data"},
])

const WipeApp = () => {
    const { auth, isLoading, error, clearError, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [files, setFiles] = useState<FSItem[]>([]);

    const loadFiles = async () => {
        const files = (await fs.readDir("./")) as FSItem[];
        setFiles(files);
    };

    useEffect(() => {
        loadFiles();
    }, []);

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate("/auth?next=/wipe");
        }
    }, [isLoading]);

    const handleDelete = async () => {
        files.forEach(async (file) => {
            await fs.delete(file.path);
        });
        await kv.flush();
        loadFiles();
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error {error}</div>;
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <section className="main-section">
                <div className="page-heading py-8">
                    <h1>Delete all your resume data</h1>
                    <div>
                        Authenticated as: {auth.user?.username}
                        <div className="mb-4">Existing files:</div>
                        <div className="flex flex-col gap-4">
                            {files.map((file) => (
                                <div key={file.id} className="flex flex-row gap-4">
                                    <p>{file.name}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <button
                                className="primary-button px-4 py-2 rounded-md cursor-pointer"
                                onClick={() => handleDelete()}
                            >
                                Wipe App Data
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default WipeApp;
