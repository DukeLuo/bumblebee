import { Command, ensureDir, globToRegExp } from "./deps.ts";

const IMAGE_URL_REGEXP = /!\[\w*\]\((\S*)\)/gm;
const DATE_REGEXP = /^date:\s*(\d{4})-(\d{2})-\d{2}/gm;

const getParams = () => {
  const postPath: string = prompt(
    "Where is the folder containing your blog posts located (using absolute paths)?",
    "./",
  )!;
  const fex: string = prompt(
    "What file extensions would you like to scan?",
    "*.md",
  )!;
  const oldDomain: string | null = prompt(
    "What is the old domain you would like to replace?",
  );
  const newDomain: string | null = prompt("What is your new domain?");

  return { postPath, fex, oldDomain, newDomain };
};

const download = async (url: string, folder: string, filename: string) => {
  const data = await (await fetch(url)).arrayBuffer();

  await ensureDir(folder);
  return Deno.writeFile(`${folder}/${filename}`, new Uint8Array(data));
};

const bumblebee = async () => {
  const dirname = new URL(".", import.meta.url).pathname;
  //deno-lint-ignore no-unused-vars
  const { postPath, fex, oldDomain, newDomain } = getParams();
  const regExp = globToRegExp(fex, {
    extended: true,
    globstar: true,
    caseInsensitive: false,
  });

  for await (const { isFile, name } of Deno.readDir(postPath)) {
    if (isFile && regExp.test(name)) {
      const content = await Deno.readTextFile(name);
      const dateMatch = DATE_REGEXP.exec(content) ?? [];
      const year = dateMatch[1];
      const month = dateMatch[2];
      const urlMatches = content.matchAll(IMAGE_URL_REGEXP);

      for (const match of urlMatches) {
        const imageURL = match[1];
        await download(
          imageURL,
          `${dirname}img/${year}/${month}`,
          `${imageURL.slice(imageURL.lastIndexOf("/") + 1)}`,
        );
      }
    }
  }
};

const program = new Command();

program
  .name("bumblebee")
  .description("CLI for migrating blog post images")
  .version("0.0.1")
  .action(bumblebee)
  .parse(Deno.args);
