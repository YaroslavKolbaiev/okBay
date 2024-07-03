<script>
	import '../app.css';
	import Footer from '$lib/components/footer.svelte';
	import Header from '$lib/components/header.svelte';
</script>

<Header />
<div style:min-height="80vh" class="container mx-auto">
	<slot />
</div>
<Footer />
