import { Command, ensureDir, globToRegExp } from "./deps.ts";
import { IChange } from "./types.ts";

const IMAGE_URL_REGEXP = /!\[\w*\]\((\S*)\)/gm;
const DATE_REGEXP = /^date:\s*(\d{4})-(\d{2})-\d{2}/gm;

const getParams = () => {
  const postPath = prompt(
    "Where is the folder containing your blog posts located (using absolute paths)?",
    "./",
  )!;
  const fex = prompt(
    "What file extensions would you like to scan?",
    "*.md",
  )!;
  const domain = prompt(
    "Which is your new domain name (e.g. files.shaiwang.life)?",
  );

  return { postPath, fex, domain };
};

const download = async (url: string, folder: string, filename: string) => {
  const response = await fetch(url);
  const data = await response.arrayBuffer();

  await ensureDir(folder);
  return Deno.writeFile(`${folder}/${filename}`, new Uint8Array(data));
};

const edit = async (filename: string, content: string, changes: IChange[]) => {
  const encoder = new TextEncoder();
  const newContent = changes.reduce(
    (acc, { old, new: newValue }) => acc.replaceAll(old, newValue),
    content,
  );
  const data = encoder.encode(newContent);

  await Deno.writeFile(filename, data, { create: false });
};

const migrate = async (filename: string, domain: string) => {
  const content = await Deno.readTextFile(filename);
  const dateMatch = DATE_REGEXP.exec(content) ?? [];
  const year = dateMatch[1];
  const month = dateMatch[2];
  const urlMatches = content.matchAll(IMAGE_URL_REGEXP);
  const changes: IChange[] = [];

  for (const match of urlMatches) {
    const imageURL = match[1];
    const imageName = imageURL.slice(imageURL.lastIndexOf("/") + 1);

    await download(
      imageURL,
      `./img/${year}/${month}`,
      `${imageName}`,
    );
    if (domain) {
      changes.push({
        old: imageURL,
        new: `https://${domain}/${year}/${month}/${imageName}`,
      });
    }
  }

  if (changes.length) {
    await edit(filename, content, changes);
  }
};

const bumblebee = async () => {
  const { postPath, fex, domain } = getParams();
  const regExp = globToRegExp(fex, {
    extended: true,
    globstar: true,
    caseInsensitive: false,
  });

  for await (const { isFile, name } of Deno.readDir(postPath)) {
    if (isFile && regExp.test(name)) {
      await migrate(name, domain ?? "");
    }
  }
};

new Command()
  .name("bumblebee")
  .description("CLI for migrating blog post images")
  .version("0.0.1")
  .action(bumblebee)
  .parse(Deno.args);
