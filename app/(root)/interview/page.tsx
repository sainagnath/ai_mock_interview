import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
    const user = await getCurrentUser();

    return (
        <>
            <h3>Interview Generation</h3>
            <Agent
                userName={user?.name || "Unknown"}
                userId={user?.id || "default_user_id"}
                type="generate"
                role="NotSpecified"
                level="NotSpecified"
                amount="0"
                techstack="NotSpecified"
            />
        </>
    );
};

export default Page;