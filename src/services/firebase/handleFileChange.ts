import { FirebaseStorageService } from './firebaseStorage';

export const handleFileUpload = async (
	eventTarget: HTMLInputElement,
	setUploadProgress: (value: number) => void,
	setImageUrl: (value: string) => void
) => {
	const { files } = eventTarget;
	const file = files![0];

	if (!file) {
		throw new Error('No file selected');
	}

	const generatedFileId = Math.random().toString(36).substring(7);

	try {
		const downloadUrl = await FirebaseStorageService.uploadFile(
			file,
			`storage/${generatedFileId}`,
			setUploadProgress
		);

		setImageUrl(downloadUrl as string);
	} catch (error: any) {
		setUploadProgress(-1);
		throw error;
	}
};
