import { createFileRoute, Link } from "@tanstack/react-router";
import { readDir, readTextFile } from "@tauri-apps/plugin-fs";
import fm from "front-matter";
import { BaseDirectory } from "@tauri-apps/api/path";
import { ArrowRightIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { PageTitle } from "../components/PageTitle";
import { platform as tauriPlatform } from "@tauri-apps/plugin-os";

function HomepageContentLink({
  to,
  params,
  children,
}: {
  to: string;
  params: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      params={params}
      className={twMerge(
        "flex flex-1 basis-xl justify-between items-center p-3 px-5 gap-3 rounded-xl group",
        "inset-ring inset-ring-ctp-surface2 text-ctp-mauve-900 dark:text-ctp-mauve-100 shadow-md shadow-ctp-mantle",
        "hover:bg-ctp-surface0"
      )}
    >
      {children}
    </Link>
  );
}

async function getRecipes() {
  const recipeFiles = await readDir("data/recipes", {
    baseDir: BaseDirectory.Resource,
  });
  const recipesList = recipeFiles.filter((file) => file.isFile);
  const recipes = await Promise.all(
    recipesList.map(async (recipe) => {
      const recipeJson = await readTextFile("data/recipes/" + recipe.name, {
        baseDir: BaseDirectory.Resource,
      });
      const recipeData = JSON.parse(recipeJson);
      return {
        ...recipeData,
        path: recipe.name,
      };
    })
  );
  return recipes.filter((r) => !r.hidden).sort((a, b) => a.name.localeCompare(b.name));
}

async function getDocs(currentPlatform?: string) {
  const docFiles = await readDir("data/docs", {
    baseDir: BaseDirectory.Resource,
  });
  const docsList = docFiles.filter((file) => file.isFile);
  const docs = await Promise.all(
    docsList.map(async (doc) => {
      const docText = await readTextFile("data/docs/" + doc.name, {
        baseDir: BaseDirectory.Resource,
      });
      const docFrontMatter = fm(docText);
      return {
        attributes: docFrontMatter.attributes as Record<string, string>,
        path: doc.name,
      };
    })
  );
  const filtered = docs.filter((d) => {
    const attrPlatform =
      (d.attributes?.platform as string | undefined) ?? undefined;
    if (!attrPlatform) return true; // no platform specified -> show for all
    const LINUX_PLATFORMS = [
      "linux",
      "freebsd",
      "dragonfly",
      "netbsd",
      "openbsd",
      "solaris",
    ];
    if (attrPlatform === "linux") {
      return currentPlatform ? LINUX_PLATFORMS.includes(currentPlatform) : true;
    }
    return currentPlatform ? attrPlatform === currentPlatform : true;
  });
  // Sort docs by their numerical prefix
  return filtered.sort((a, b) => {
    const aNum = parseInt(a.path.split("-")[0]);
    const bNum = parseInt(b.path.split("-")[0]);
    return aNum - bNum;
  });
}

export const Route = createFileRoute("/")({
  loader: async () => {
    let currentPlatform: string | undefined;
    try {
      currentPlatform = await tauriPlatform();
    } catch (_e) {
      currentPlatform = undefined;
    }
    const [recipes, docs] = await Promise.all([
      getRecipes(),
      getDocs(currentPlatform),
    ]);
    return {
      recipes,
      docs,
    };
  },
  component: Index,
});

function Index() {
  const { recipes, docs } = Route.useLoaderData();
  return (
    <div className="p-2 mx-auto max-w-prose flex flex-col gap-4">
      <PageTitle className="text-2xl my-2 font-bold">
        Welcome to Command Line Cookbook 🧑‍💻🍳📓
      </PageTitle>
      <div>
        <h2 className="text-lg font-bold">Docs</h2>
        <div className="flex justify-stretch flex-wrap gap-3">
          {docs.map((doc) => (
            <HomepageContentLink
              to={`/docs/$`}
              params={{ _splat: doc.path }}
              key={doc.path}
            >
              <span className="group-hover:underline">
                {doc.attributes.title}
              </span>
              <div className="flex gap-2 items-center">
                {doc.path === "0-tutorial.mdx" && (
                  <span className="text-sm bg-ctp-green px-2 py-1 rounded-sm text-ctp-base">
                    Start Here!
                  </span>
                )}
                <ArrowRightIcon className="w-4 h-4" />
              </div>
            </HomepageContentLink>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold">Recipes</h2>
        <div className="flex justify-stretch flex-wrap gap-3">
          {recipes.map((recipe) => (
            <HomepageContentLink
              to={`/recipes/$`}
              params={{ _splat: recipe.path }}
              key={recipe.path}
            >
              <div className="flex flex-col">
                <span className="flex items-center gap-2">
                  <span className="group-hover:underline">
                    {recipe.name}
                  </span>
                  <span className="text-sm bg-ctp-rosewater-800/50 px-1 rounded-sm text-white">
                    {recipe.base}
                  </span>
                </span>
                {/* <span>{recipe.description}</span> */}
              </div>
              <ArrowRightIcon className="w-4 h-4" />
            </HomepageContentLink>
          ))}
        </div>
      </div>
    </div>
  );
}
