import { Command, globToRegExp } from "./deps.ts";

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

const bumblebee = async () => {
  //deno-lint-ignore no-unused-vars
  const { postPath, fex, oldDomain, newDomain } = getParams();
  const regExp = globToRegExp(fex, {
    extended: true,
    globstar: true,
    caseInsensitive: false,
  });

  for await (const { isFile, name } of Deno.readDir(postPath)) {
    // deno-lint-ignore no-empty
    if (isFile && regExp.test(name)) {
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
