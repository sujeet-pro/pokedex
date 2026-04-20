import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";
import { isLocale } from "~/types/locales";
import { Layout } from "~/components/Layout";

export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.lang)) throw notFound();
  },
  component: LangLayout,
});

function LangLayout() {
  const { lang } = Route.useParams();
  if (!isLocale(lang)) return null;
  return (
    <Layout locale={lang}>
      <Outlet />
    </Layout>
  );
}
