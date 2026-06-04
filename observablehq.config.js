// Observable Framework config for csl-standards
// https://observablehq.com/framework/config

export default {
  root: "src",
  title: "CSL Standards",
  pages: [
    {
      name: "Overview",
      path: "/"
    },
    {
      name: "Interoperability",
      pages: [
        { name: "MW-PWG-PWK hard cases", path: "/tools/interoperability-hard-cases" }
      ]
    }
  ],
  footer: "Source: CDSL · CC-BY-SA-4.0 · build {sha}",
  theme: "wide",
  toc: true,
  search: true
};
