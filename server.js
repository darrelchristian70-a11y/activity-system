async function getGroupMembers() {
    if (!ROBLOX_API_KEY) {
        throw new Error("Missing ROBLOX_API_KEY in Railway Variables.");
    }

    let members = [];
    let cursor = "";

    do {
        const url =
            `https://groups.roblox.com/v1/groups/${GROUP_ID}/users?limit=100` +
            (cursor ? `&cursor=${cursor}` : "");

        const response = await fetch(url);

        const text = await response.text();

        if (!response.ok) {
            console.log("Roblox group API error:", response.status, text);
            throw new Error("Failed to fetch group members.");
        }

        const json = JSON.parse(text);

        for (const item of json.data || []) {
            members.push({
                userId: String(item.user.userId),
                username: item.user.username
            });
        }

        cursor = json.nextPageCursor || "";
    } while (cursor);

    return members;
}
