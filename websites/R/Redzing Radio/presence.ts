const presence = new Presence({
		clientId: "1321107273875062866",
	}),
	browsingTimestamp = Math.floor(Date.now() / 1000);

const enum Assets { // Other default assets can be found at index.d.ts
	Logo = "https://i.imgur.com/umqxGHq.jpeg",
}

presence.on("UpdateData", async () => {
	let presenceData: PresenceData = {
		largeImageKey: Assets.Logo,
		type: ActivityType.Listening,
	};

	const { href, pathname } = document.location,
		[showTimestamp, showButtons] = await Promise.all([
			presence.getSetting<boolean>("timestamp"),
			presence.getSetting<boolean>("buttons"),
		]),
		pages: Record<string, PresenceData> = {
			"/404": {
				details: "Not Found",
				state: "Help",
			},
		};

	for (const [path, data] of Object.entries(pages))
		if (pathname.includes(path)) presenceData = { ...presenceData, ...data };

	if (pathname === "/") {
		const paused =
			document.querySelector("button > img")?.getAttribute("alt") === "Play";

		presenceData.details = document.querySelector("h1.text-xl")?.textContent;
		presenceData.state = `Artist - ${
			document.querySelector(
				"p.text-xl.font-semibold.text-blue-600.break-words"
			)?.textContent
		}`;
		presenceData.largeImageKey = document
			.querySelector("img.rounded-md.transition-transform")
			?.getAttribute("src");
		presenceData.smallImageKey = paused ? Assets.Pause : Assets.Play;
		presenceData.smallImageText = paused ? "Paused" : "Playing";
		presenceData.buttons = [
			{
				label: "Listen to Redzing Radio",
				url: href,
			},
		];
	}

	if (!showButtons) delete presenceData.buttons;
	if (showTimestamp) presenceData.startTimestamp = browsingTimestamp;

	if (presenceData.details) presence.setActivity(presenceData);
	else presence.setActivity();
});
