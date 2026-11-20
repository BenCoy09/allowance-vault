import pathlib
d = pathlib.Path(__file__).parent / "src"
css = (d / "styles.css").read_text()
js = "\n".join((d / f).read_text() for f in ["core.js", "app1.js", "app2.js", "app3.js"])
js = js.replace("</script", "<\\/script")
html = f'''<title>Allowance Vault</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="A Bitcoin Cash covenant that limits what an AI agent can spend. Reference model and Security Lab. Not deployed or audited.">
<meta name="theme-color" content="#101311">
<meta property="og:title" content="Allowance Vault">
<meta property="og:description" content="Your agent can spend. Your covenant sets the limits.">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="Allowance Vault">
<meta name="twitter:description" content="Your agent can spend. Your covenant sets the limits.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100,700;112,800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;600&display=swap">
<style>
{css}
</style>
<canvas id="bg" aria-hidden="true"></canvas>
<div id="root"></div>
<div id="modal"></div>
<div id="toast" role="status" aria-live="polite"></div>
<script>
{js}
</script>
'''
(d.parent / "index.html").write_text(html)
print(len(html))
