const express = require("express");

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1515384597133660303/zskDPHYYGhnKF1rUngtG88IrejZwqaslw06TrQwuxuaksuJzXlQD2AuZhOyCqbL8fc-J";

const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
const GROUP_ID = process.env.GROUP_ID || "15038532";

const REQUIRED_PLAYTIME = 1800;
const REQUIRED_PD_GAIN = 3;

let activity = {};

async function sendDiscord(message) {
    await fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            content: message
        })
    });
}

async function getGroupMembers() {
    if (!ROBLOX_API_KEY) {
        throw new Error("Missing ROBLOX_API_KEY in Railway Variables.");
    }

    let members = [];
    let pageToken = "";

    do {
        const url =
            `https://apis.roblox.com/cloud/v2/groups/${GROUP_ID}/memberships` +
            `?maxPageSize=100` +
            (pageToken ? `&pageToken=${pageToken}` : "");

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "x-api-key": ROBLOX_API_KEY
            }
        });

        const text = await response.text();

        if (!response.ok) {
            console.log("Roblox API error:", response.status, text);
            throw new Error("Failed to fetch group members.");
        }

        const json = JSON.parse(text);

        const list = json.groupMemberships || json.memberships || [];

        for (const membership of list) {
            const user =
                membership.user ||
                membership.path ||
                membership.robloxUser ||
                membership;

            let userId =
                membership.userId ||
                membership.user?.id ||
                membership.user?.userId ||
                membership.robloxUser?.id;

            let username =
                membership.username ||
                membership.user?.name ||
                membership.robloxUser?.name ||
                `User_${userId}`;

            if (!userId && typeof user === "string") {
                const match = user.match(/users\/(\d+)/);
                if (match) {
                    userId = match[1];
                }
            }

            if (userId) {
                members.push({
                    userId: String(userId),
                    username: username || `User_${userId}`
                });
            }
        }

        pageToken = json.nextPageToken || "";
    } while (pageToken);

    return members;
}

app.get("/", (req, res) => {
    res.send("Activity system online");
});

app.post("/activity", async (req, res) => {
    const { username, userId, playtime, pd } = req.body;
    const id = String(userId);

    if (!activity[id]) {
        activity[id] = {
            username,
            userId: id,
            playtime: 0,
            pdCountBefore: Number(pd) || 0,
            pdCount: Number(pd) || 0
        };
    }

    activity[id].username = username;
    activity[id].userId = id;
    activity[id].playtime = Number(playtime) || 0;
    activity[id].pdCount = Number(pd) || 0;

    await sendDiscord(
`ACTIVITY RECIEVED
USERNAME: ${username}
USERID: ${id}
PLAYTIME: ${activity[id].playtime}
PDCountBefore: ${activity[id].pdCountBefore}
PDCount: ${activity[id].pdCount}`
    );

    res.json({ success: true });
});

app.get("/check", async (req, res) => {
    try {
        const members = await getGroupMembers();
        let purgeCount = 0;

        for (const member of members) {
            const id = String(member.userId);
            const data = activity[id];

            if (!data) {
                purgeCount++;

                await sendDiscord(
`PLAYER NEEDS TO BE PURGED FOR INACTIVTY!
USERNAME: ${member.username}
USERID: ${id}
PLAYTIME: 0
PDCountBefore: UNKNOWN
PDCount: UNKNOWN`
                );

                continue;
            }

            const pdGain = data.pdCount - data.pdCountBefore;

            if (data.playtime < REQUIRED_PLAYTIME || pdGain < REQUIRED_PD_GAIN) {
                purgeCount++;

                await sendDiscord(
`PLAYER NEEDS TO BE PURGED FOR INACTIVTY!
USERNAME: ${data.username}
USERID: ${id}
PLAYTIME: ${data.playtime}
PDCountBefore: ${data.pdCountBefore}
PDCount: ${data.pdCount}`
                );
            }
        }

        if (purgeCount === 0) {
            await sendDiscord("Everyone passed activity.");
        }

        activity = {};

        res.send(`Activity checked. ${purgeCount} player(s) need purge.`);
    } catch (error) {
        console.error(error);

        res.status(500).send(error.message);
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});
