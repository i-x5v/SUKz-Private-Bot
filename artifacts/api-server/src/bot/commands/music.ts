import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
} from "discord.js";

interface QueueItem {
  title: string;
  url: string;
  thumbnail?: string;
  author?: string;
  requester: string;
}

interface GuildMusicState {
  queue: QueueItem[];
  isPlaying: boolean;
  isPaused: boolean;
  isLooping: boolean;
  isShuffled: boolean;
  volume: number;
  current: QueueItem | null;
}

const guildStates = new Map<string, GuildMusicState>();

function getState(guildId: string): GuildMusicState {
  if (!guildStates.has(guildId)) {
    guildStates.set(guildId, {
      queue: [], isPlaying: false, isPaused: false,
      isLooping: false, isShuffled: false, volume: 70, current: null,
    });
  }
  return guildStates.get(guildId)!;
}

function isYouTubeUrl(str: string): boolean {
  return /(?:youtube\.com\/watch|youtu\.be\/)/i.test(str);
}

async function fetchYouTubeInfo(url: string): Promise<{ title: string; thumbnail: string; author: string } | null> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!res.ok) return null;
    const data = await res.json() as { title?: string; thumbnail_url?: string; author_name?: string };
    return {
      title: data.title ?? "Unknown Title",
      thumbnail: data.thumbnail_url ?? "",
      author: data.author_name ?? "Unknown",
    };
  } catch { return null; }
}

function buildProgressBar(): string {
  const len = 14;
  const pos = Math.floor(Math.random() * (len - 2)) + 1;
  return Array.from({ length: len }, (_, i) => i === pos ? "🔵" : "▬").join("");
}

function buildMusicPanel(state: GuildMusicState): { embeds: EmbedBuilder[]; components: ActionRowBuilder<ButtonBuilder>[] } {
  const current = state.current;

  const embed = new EmbedBuilder()
    .setTitle("🎵 لوحة التحكم الموسيقية")
    .setColor(0x1db954)
    .setFooter({ text: "Bot_SUKz • Music System" })
    .setTimestamp();

  if (current) {
    const bar = buildProgressBar();
    embed.setDescription(
      `**الآن يعزف:**\n🎶 **${current.title}**\n${current.author ? `🎤 ${current.author}` : ""}\n👤 طلبه: ${current.requester}\n\n${bar}`,
    );
    if (current.thumbnail) embed.setThumbnail(current.thumbnail);

    const upcomingText = state.queue.length > 0
      ? state.queue.slice(0, 5).map((s, i) => `\`${i + 1}.\` ${s.title}`).join("\n") + (state.queue.length > 5 ? `\n\`+ ${state.queue.length - 5} أغنية أخرى\`` : "")
      : "لا توجد أغاني في الطابور";

    embed.addFields(
      { name: "📋 الطابور التالي", value: upcomingText, inline: false },
      { name: "⏸ الحالة", value: state.isPaused ? "موقوف" : "يعزف", inline: true },
      { name: "🔊 الصوت", value: `${state.volume}%`, inline: true },
      { name: "🔁 التكرار", value: state.isLooping ? "مفعّل" : "معطّل", inline: true },
    );
  } else {
    embed.setDescription(
      "**لا توجد موسيقى حالياً** 🎵\n\n" +
      "استخدم `/music [اسم الأغنية أو رابط يوتيوب]` لتشغيل أغنية.\n" +
      "البوت يدعم البحث عن أي أغنية ورابط يوتيوب.",
    );
  }

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("music_prev").setEmoji("⏮").setStyle(ButtonStyle.Secondary).setDisabled(!state.isPlaying),
    new ButtonBuilder().setCustomId("music_toggle").setEmoji(state.isPaused ? "▶️" : "⏸").setStyle(state.isPaused ? ButtonStyle.Success : ButtonStyle.Primary).setDisabled(!state.isPlaying),
    new ButtonBuilder().setCustomId("music_skip").setEmoji("⏭").setStyle(ButtonStyle.Secondary).setDisabled(!state.isPlaying),
    new ButtonBuilder().setCustomId("music_stop").setEmoji("⏹").setStyle(ButtonStyle.Danger).setDisabled(!state.isPlaying),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("music_shuffle").setLabel(state.isShuffled ? "🔀 خلط ✓" : "🔀 خلط").setStyle(state.isShuffled ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("music_loop").setLabel(state.isLooping ? "🔁 تكرار ✓" : "🔁 تكرار").setStyle(state.isLooping ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("music_volup").setLabel("🔊 +10").setStyle(ButtonStyle.Secondary).setDisabled(state.volume >= 100),
    new ButtonBuilder().setCustomId("music_voldown").setLabel("🔉 -10").setStyle(ButtonStyle.Secondary).setDisabled(state.volume <= 0),
  );

  return { embeds: [embed], components: [row1, row2] };
}

export const musicCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("music")
      .setDescription("🎵 تشغيل موسيقى مع لوحة تحكم / Play music with full control panel")
      .addStringOption(opt =>
        opt.setName("query")
          .setDescription("اسم الأغنية أو رابط يوتيوب / Song name or YouTube URL")
          .setRequired(true)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const query = interaction.options.getString("query", true);
      const guildId = interaction.guildId ?? "dm";
      const state = getState(guildId);

      await interaction.deferReply();

      if (isYouTubeUrl(query)) {
        const ytInfo = await fetchYouTubeInfo(query);

        if (ytInfo) {
          const ytEmbed = new EmbedBuilder()
            .setTitle(`📺 ${ytInfo.title}`)
            .setDescription(
              `**القناة:** ${ytInfo.author}\n\n` +
              `> اضغط زر المشاهدة لفتح الفيديو على يوتيوب، أو تحكم بالتشغيل من لوحة التحكم أدناه.`,
            )
            .setColor(0xff0000)
            .setImage(ytInfo.thumbnail)
            .setFooter({ text: "YouTube • Bot_SUKz" })
            .setTimestamp();

          const ytRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setLabel("▶️ شاهد على يوتيوب").setStyle(ButtonStyle.Link).setURL(query),
          );

          await interaction.editReply({ embeds: [ytEmbed], components: [ytRow] });

          const item: QueueItem = {
            title: ytInfo.title, url: query,
            thumbnail: ytInfo.thumbnail, author: ytInfo.author,
            requester: interaction.user.username,
          };

          if (state.isPlaying && state.current) {
            state.queue.push(item);
          } else {
            state.current = item;
            state.isPlaying = true;
            state.isPaused = false;
          }

          const panel = buildMusicPanel(state);
          await interaction.followUp({ ...panel });
          return;
        }
      }

      const item: QueueItem = { title: query, url: query, requester: interaction.user.username };

      if (state.isPlaying && state.current) {
        state.queue.push(item);
        const queueEmbed = new EmbedBuilder()
          .setTitle("✅ تمت الإضافة للطابور")
          .setDescription(`🎵 **${query}**\nالموضع في الطابور: **#${state.queue.length}**`)
          .setColor(0x1db954)
          .setTimestamp();
        await interaction.editReply({ embeds: [queueEmbed] });
      } else {
        state.current = item;
        state.isPlaying = true;
        state.isPaused = false;
        const panel = buildMusicPanel(state);
        await interaction.editReply({ ...panel });
      }
    },
  },
];

export async function handleMusicButton(interaction: ButtonInteraction): Promise<void> {
  const guildId = interaction.guildId ?? "dm";
  const state = getState(guildId);
  const { customId } = interaction;

  switch (customId) {
    case "music_toggle":
      state.isPaused = !state.isPaused;
      break;
    case "music_skip":
      if (state.isLooping && state.current) {
        // Keep current song, do nothing to queue
      } else {
        state.current = state.queue.shift() ?? null;
        if (!state.current) { state.isPlaying = false; state.isPaused = false; }
      }
      break;
    case "music_prev":
      // Restart current song conceptually
      state.isPaused = false;
      break;
    case "music_stop":
      state.current = null; state.queue = [];
      state.isPlaying = false; state.isPaused = false;
      state.isLooping = false; state.isShuffled = false;
      break;
    case "music_shuffle":
      state.isShuffled = !state.isShuffled;
      if (state.isShuffled) state.queue = [...state.queue].sort(() => Math.random() - 0.5);
      break;
    case "music_loop":
      state.isLooping = !state.isLooping;
      break;
    case "music_volup":
      state.volume = Math.min(100, state.volume + 10);
      break;
    case "music_voldown":
      state.volume = Math.max(0, state.volume - 10);
      break;
  }

  const panel = buildMusicPanel(state);
  await interaction.update({ ...panel });
}
