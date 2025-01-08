const presence = new Presence({
		clientId: "1322741334112473179",
	}),
	strings = presence.getStrings({
		play: "general.playing",
		pause: "general.paused",
		home: "general.viewHome",
		search: "general.searchFor",
		browse: "general.browsing",
		reading: "general.reading",
		buttonViewPage: "general.buttonViewPage",
		buttonViewEpisode: "general.buttonViewEpisode",
		buttonWatchAnime: "general.buttonWatchAnime",
		buttonWatchMovie: "general.buttonWatchMovie",
		buttonViewSeries: "general.buttonViewSeries",
	}),
	browsingTimestamp = Math.floor(Date.now() / 1000);

const enum Assets {
	Logo = "https://hydrahd.org/wp-content/uploads/2024/10/HydraHD-icon2.webp",
}

let video = {
	duration: 0,
	currentTime: 0,
	paused: true,
};

presence.on(
	"iFrameData",
	(data: { duration: number; currentTime: number; paused: boolean }) => {
		video = data;
	}
);

presence.on("UpdateData", async () => {
	let presenceData: PresenceData = {
		largeImageKey: Assets.Logo,
		startTimestamp: browsingTimestamp,
		type: ActivityType.Watching,
		details: "Unsupported Page",
	};

	const { href, pathname } = document.location,
		[showTimestamp, showButtons, privacy] = await Promise.all([
			presence.getSetting<boolean>("timestamp"),
			presence.getSetting<boolean>("buttons"),
			presence.getSetting<boolean>("privacy"),
		]);

	if (privacy) {
		presenceData.details = "Watching HydraHD";
		presence.setActivity(presenceData);
		return;
	}

	const pages: Record<string, PresenceData> = {
		"/": {
			details: (await strings).home,
			smallImageKey: Assets.Viewing,
		},
		"/today": {
			details: "Viewing Airing Today",
			smallImageKey: Assets.Viewing,
		},
	};

	for (const [path, data] of Object.entries(pages))
		if (pathname.includes(path)) presenceData = { ...presenceData, ...data };

	if (pathname.includes("/movie")) {
		const [startTimestamp, endTimestamp] = presence.getTimestamps(
			Math.floor(video.currentTime),
			Math.floor(video.duration)
		);

		if (showTimestamp) {
			[presenceData.startTimestamp, presenceData.endTimestamp] = [
				startTimestamp,
				endTimestamp,
			];
		}

		presenceData.details =
			document.querySelector("div.ploting > h1")?.textContent;
		presenceData.state = `⭐ ${
			document.querySelector("div.text > span.R")?.textContent
		} - ${document.querySelector("div.text > span.L")?.textContent}`;
		presenceData.largeImageKey = document
			.querySelector("img.hidden-xs")
			?.getAttribute("src");
		presenceData.smallImageKey = video.paused ? Assets.Pause : Assets.Play;
		presenceData.smallImageText = video.paused
			? (await strings).pause
			: (await strings).play;
		presenceData.buttons = [
			{
				label: (await strings).buttonWatchMovie,
				url: href,
			},
		];

		if (video.paused) delete presenceData.endTimestamp;
	} else if (pathname.includes("/watchseries")) {
		const [startTimestamp, endTimestamp] = presence.getTimestamps(
			Math.floor(video.currentTime),
			Math.floor(video.duration)
		);

		if (showTimestamp) {
			[presenceData.startTimestamp, presenceData.endTimestamp] = [
				startTimestamp,
				endTimestamp,
			];
		}

		presenceData.details = document
			.querySelector("div.ploting > h1")
			?.textContent.replace(/(Episode\s\d+)([A-Za-z]+)/, "$1 $2");
		presenceData.state = `⭐ ${
			document.querySelector("div.text > span.R")?.textContent
		} - ${document.querySelector("div.text > span.L")?.textContent}`;
		presenceData.largeImageKey = document
			.querySelector("img.hidden-xs")
			?.getAttribute("src");
		presenceData.smallImageKey = video.paused ? Assets.Pause : Assets.Play;
		presenceData.smallImageText = video.paused
			? (await strings).pause
			: (await strings).play;
		presenceData.buttons = [
			{
				label: (await strings).buttonViewEpisode,
				url: href,
			},
			{
				label: (await strings).buttonViewSeries,
				url: href.split("/season/")[0],
			},
		];

		if (video.paused) delete presenceData.endTimestamp;
	} else if (pathname.includes("/person")) {
		const profession = document.querySelectorAll(
			"div.row.diz-title > span > a"
		)[2]?.textContent;

		presenceData.details = document.querySelector("div > h1")?.textContent;
		presenceData.state = `Profession: ${
			profession?.includes("Acting")
				? profession?.replace("Acting", "Actor")
				: profession
		}`;
		presenceData.largeImageKey = document
			.querySelector("img.personposter")
			?.getAttribute("src");
		presenceData.smallImageKey = Assets.Logo;
		presenceData.buttons = [
			{
				label: `View ${
					profession?.includes("Acting")
						? profession?.replace("Acting", "Actor")
						: profession
				}`,
				url: href,
			},
		];
	}

	if (!showButtons && presenceData.buttons) delete presenceData.buttons;

	if (presenceData.details) presence.setActivity(presenceData);
	else presence.setActivity();
});
