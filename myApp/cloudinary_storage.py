import cloudinary
from cloudinary_storage.storage import MediaCloudinaryStorage


class ProjectMediaCloudinaryStorage(MediaCloudinaryStorage):

    VIDEO_EXTENSIONS = [
        '.mp4',
        '.webm',
        '.ogg',
        '.mov',
        '.avi',
        '.mkv',
        '.wmv',
        '.mpeg',
        '.mpg',
    ]

    IMAGE_EXTENSIONS = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.webp',
        '.bmp',
        '.tiff',
    ]

    def _get_resource_type(self, name):
        name = name.lower()

        for extension in self.VIDEO_EXTENSIONS:
            if name.endswith(extension):
                return 'video'

        return 'image'

    def _save(self, name, content):
        name = self._normalise_name(name)
        name = self._prepend_prefix(name)

        response = self._upload(
            name,
            content
        )

        public_id = response['public_id']

        resource_type = self._get_resource_type(name)

        # Keep the resource type and original extension
        # so Django can correctly generate the URL later.
        if resource_type == 'video':
            extension = next(
                extension
                for extension in self.VIDEO_EXTENSIONS
                if name.lower().endswith(extension)
            )
        else:
            extension = next(
                (
                    extension
                    for extension in self.IMAGE_EXTENSIONS
                    if name.lower().endswith(extension)
                ),
                ''
            )

        return f'{public_id}{extension}'

    def _get_url(self, name):
        resource_type = self._get_resource_type(name)

        extension = ''

        all_extensions = (
            self.VIDEO_EXTENSIONS
            + self.IMAGE_EXTENSIONS
        )

        for possible_extension in all_extensions:
            if name.lower().endswith(possible_extension):
                extension = possible_extension
                name = name[:-len(possible_extension)]
                break

        cloudinary_resource = cloudinary.CloudinaryResource(
            name,
            default_resource_type=resource_type
        )

        return cloudinary_resource.url + extension