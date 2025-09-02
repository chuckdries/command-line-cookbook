import { createFileRoute, notFound } from "@tanstack/react-router";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { resolveResource } from "@tauri-apps/api/path";
import { Recipe } from "../features/CommandBuilder/commandBuilderTypes";
import { useTerminalContext } from "../features/Terminal/useTerminalContext";
import { useEffect } from "react";
import { CommandBuilder } from "../features/CommandBuilder/CommandBuilder";
import { PageTitle } from "../components/PageTitle";

export const Route = createFileRoute("/recipes/$")({
  loader: async ({ params }) => {
    if (!params._splat) {
      throw notFound();
    }
    const recipeResource = await resolveResource("data/recipes/" + params._splat);
    const recipeJson = await readTextFile(recipeResource);
    if (!recipeJson) {
      throw notFound();
    }
    const recipe = JSON.parse(recipeJson) as Recipe;
    if (!recipe) {
      throw notFound();
    }
    return {
      recipe,
    };
  },
  component: Recipes,
});

function Recipes() {
  const { recipe } = Route.useLoaderData();
  const { setPanelVisible, writeToPty } = useTerminalContext();
  useEffect(() => {
    setPanelVisible(true);
  }, [setPanelVisible]);
  return (
    <div className="p-2 mx-auto">
      <PageTitle className="text-2xl font-bold mb-4">{recipe.name}</PageTitle>
      <p className="my-4">{recipe.description}</p>
      <CommandBuilder recipe={recipe} onSubmit={writeToPty} />
    </div>
  );
}
