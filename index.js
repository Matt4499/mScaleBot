const FFMPEG = require("fluent-ffmpeg");
const fs = require("fs");
const chalk = require("chalk");
const Discord = require("discord.js");
const path = require("path");
const https = require("https");
const client = new Discord.Client();
const prefix = "-";
client.on("ready", () => {
	console.log(
		`mBot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`
	);
	client.user.setActivity(`Status: GOOD`);
});

client.on("message", async (message) => {
	if (message.author.bot || !message.content.startsWith(prefix)) return;
	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();
	if (command === "test") {
		message.reply("all is good");
	}
	if (command === "60") {
		if (message.attachments.size > 0) {
			message.reply("Attachment detected, attempting to save...");
			const first = message.attachments.first();
			const filename = first.name;
			const filetype = filename.split(".").pop();
			if (filetype.toLowerCase() != "mp4") {
				if (filetype.toLowerCase() == "gif") {
					message.reply("Begin process gif > mp4...");
					const giffile = fs.createWriteStream(`./videos/${filename}`);
					https.get(first.url, function (res) {
						res.pipe(giffile);
						giffile.on("finish", function () {
							try {
								const gifmp4 = new FFMPEG(`./videos/${filename}`).inputOptions([
									"-f gif",
								]);
								gifmp4.save(`./videos/${filename}.mp4`);
								gifmp4.on("end", function () {
									message.reply(
										"Successfully converted gif to mp4. Attempting to convert to 60fps;"
									);
									gifto60(`${filename}.mp4`, message);
									return;
								});
							} catch (e) {
								console.error(err);
							}
						});
					});

					return;
				}
				message.reply("that is not a mp4, that is a " + filetype);
				return;
			}
			if (first.size > 8000000) {
				message.reply("that video is too big :(");
				return;
			}
			const file = fs.createWriteStream(`./videos/${filename}`);
			https.get(first.url, function (response) {
				response.pipe(file);
				file.on("finish", function () {
					file.close();
					message.reply("The attachment should now be saved");
					try {
						var video = new FFMPEG(`./videos/${filename}`)
							.outputOptions([
								"-tune animation",
								"-crf 22",
								"-filter:v minterpolate='mi_mode=mci:mc_mode=aobmc:vsbmc=1:fps=60'",
							])
							.outputFps(60);
						message.reply(`Processing ${filename} to 60 fps...`);
						video.save(`./videos/60-${filename}`);
					} catch (e) {
						message.reply("An error occured: " + e);
						return;
					}
					video.on("end", function (stdout, stderr) {
						const finished = new Discord.MessageAttachment(
							`./videos/60-${filename}`
						);
						message.reply("Complete!");
						message.channel.send(finished);
					});
				});
				file.on("error", function (err) {
					fs.unlink(`./videos/${filename}`);
					message.reply("An error occured while saving the attachment.");
				});
			});
		} else {
			message.reply("No attachments detected");
		}
	}
});
function gifto60(filename, message) {
	try {
		var video = new FFMPEG(`./videos/${filename}`)
			.outputOptions([
				"-tune animation",
				"-crf 22",
				"-filter:v minterpolate='mi_mode=mci:mc_mode=aobmc:vsbmc=1:fps=60'",
			])
			.outputFps(60);
		message.reply(`Processing ${filename} to 60 fps...`);
		video.save(`./videos/60-${filename}`);
	} catch (e) {
		message.reply("An error occured.");
		return;
	}
	video.on("end", function (stdout, stderr) {
		const finished = new Discord.MessageAttachment(`./videos/60-${filename}`);
		message.reply("Complete!");
		message.channel.send(finished);
		// fs.unlink(`./videos/${filename}`, function (err, data) {
		// 	console.log("removing file 1");
		// });
		// fs.unlink(`./videos/60-${filename}`, function () {
		// 	console.log("removing file 2");
		// });
	});
}
client.login("token"); // I totally didn't just leak my token. (I reset it :P) 
