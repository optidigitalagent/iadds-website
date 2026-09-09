import {defineCloudflareConfig} from '@opennextjs/cloudflare';
// No ISR, tag invalidation, runtime image resizing or external caches are required.
export default defineCloudflareConfig({incrementalCache:'dummy',tagCache:'dummy',queue:'dummy'});
