const express = require("express");
const cron = require("node-cron");

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK = "YOUR_WEBHOOK_HERE";
const GROUP_ID = "15038532";

const REQUIRED_PLAYTIME = 1800; // 30 minutes
const REQUIRED_PD_GAIN = 3;

let activity = {};

async function sendDiscord(message) {
    await fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            content: message.slice(0, 1900)
        })
    });
}

async function getGroupMembers() {
    let members = [];
    let cursor = "";

    do {
        const url =
            `https://groups.roblox.com/v1/groups/${GROUP_ID}/users?limit=100` +
            (cursor ? `&cursor=${cursor}` : "");

        const response = await fetch(url);

        if (!response.ok) {
            const text = await response.text();
            console.log("Roblox group API error:", response.status, text);
            throw new Error("Failed to fetch group members");
        }

        const json = await response.json();

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

async function runActivityCheck() {
    const members = await getGroupMembers();
    let purgeCount = 0;

    for (const member of members) {
        const data = activity[String(member.userId)];

        if (!data) {
            purgeCount++;

            await sendDiscord(
`PLAYER NEEDS TO BE PURGED FOR INACTIVTY!
USERNAME: ${member.username}
USERID: ${member.userId}
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
USERID: ${data.userId}
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

    res.json({
        success: true
    });
});

app.get("/check", async (req, res) => {
    res.send("Manual activity check started. Watch Discord.");

    try {
        await runActivityCheck();
    } catch (error) {
        console.error("Manual check failed:", error);
    }
});

// every 3 days at midnight
cron.schedule("0 0 */3 * *", async () => {
    console.log("Running automatic 3-day activity check");

    try {
        await runActivityCheck();
    } catch (error) {
        console.error("Automatic check failed:", error);
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});
