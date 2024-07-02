<script lang="ts">
	import { goto } from '$app/navigation';
	import { post } from '$lib/fetch';
	import { FirebaseStorageService } from '$services/firebase/firebaseStorage';
	import { handleFileUpload } from '$services/firebase/handleFileChange';

	let name = '';
	let duration = 60;
	let desc = '';
	let imageUrl = '';
	let uploadProgress = -1;
	let data = null;
	let err = null;

	async function onSubmit() {
		[data, err] = await post('/dashboard/items/new', {
			name,
			description: desc,
			duration,
			imageUrl
		});

		if (!err) {
			goto(`/items/${data.id}`);
		}
	}

	async function handleFile(eventTarget: HTMLInputElement) {
		await handleFileUpload(
			eventTarget,
			(value: number) => {
				uploadProgress = value;
			},
			(value: string) => {
				imageUrl = value;
			}
		);
	}

	function handleCancelUploadFile() {
		FirebaseStorageService.deleteFile(imageUrl);
		imageUrl = '';
		uploadProgress = -1;
	}
</script>

<div class="w-1/2 mx-auto">
	<form on:submit|preventDefault={onSubmit}>
		<div class="flex flex-col mb-2">
			<label for="name" class="font-bold">Item Name</label>
			<input
				bind:value={name}
				id="name"
				required
				minlength="3"
				maxlength="60"
				type="text"
				class=" rounded-lg border-transparent flex-1 appearance-none border border-gray-300 w-full py-2 px-4 bg-white text-gray-700 placeholder-gray-400 shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
				name="username"
				placeholder="Item Name"
			/>
		</div>

		<div class="mb-2">
			<label for="desc" class="font-bold">Description</label>
			<textarea
				bind:value={desc}
				id="desc"
				required
				minlength="3"
				maxlength="600"
				class="rounded-lg border-transparent flex-1 border border-gray-300 w-full py-2 px-4 bg-white text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
				name="description"
				placeholder="Item Description"
			/>
		</div>

		<div class="flex flex-col mb-2">
			<label for="duration" class="font-bold">Duration</label>
			<select
				bind:value={duration}
				id="duration"
				class="border py-2 px-5 shadow-sm border-gray-300 rounded"
			>
				<option value={60}>One Minute</option>
				<option value={60 * 10}>Ten Minutes</option>
				<option value={60 * 60 * 24}>One Day</option>
				<option value={60 * 60 * 24 * 7}>One Week</option>
			</select>
		</div>

		<div class="mb-2">
			<label for="image" class="font-semibold">Choose Your Image</label>
			<input
				on:change={(e) => handleFile(e.currentTarget)}
				type="file"
				id="image"
				name="image"
				accept="image/*"
				class="boblock w-full border border-gray-200 cursor-pointer rounded-md text-sm file:border-0 file:cursor-pointer file:bg-gray-300 file:mr-4 file:p-2"
			/>
		</div>

		{#if uploadProgress > -1}
			<div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
				<div class="bg-sky-700 h-2.5 rounded-full" style="width: {uploadProgress}%" />
			</div>
		{/if}

		{#if imageUrl}
			<div class="flex justify-center flex-col items-start gap-2 mb-2">
				<img src={imageUrl} alt="ImagePreview" class="object-cover object-center" />
				<button
					disabled={imageUrl === ''}
					aria-label="deleteImage"
					type="button"
					class="bg-red-700
                  text-lg
                  font-medium
                  rounded-xl
                  text-white
                  px-8
                  py-3
                  cursor-pointer
                "
					on:click={handleCancelUploadFile}
				>
					Cancel
				</button>
			</div>
		{/if}

		{#if err}
			{err}
		{/if}

		<button
			class="py-2 px-4 w-1/3 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 focus:ring-offset-indigo-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2  rounded-lg "
		>
			Submit
		</button>
	</form>
</div>
