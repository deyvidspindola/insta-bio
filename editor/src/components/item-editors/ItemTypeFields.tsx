import type { SectionItem } from '@bio-types'
import { AppHeroItemFields, WhatsAppHeroItemFields } from './AppHeroItemFields'
import { FeatureItemFields } from './FeatureItemFields'
import { GridItemFields } from './GridItemFields'
import { LinkItemFields } from './LinkItemFields'
import { ListItemFields } from './ListItemFields'
import { LocationItemFields } from './LocationItemFields'
import { ProductsItemFields } from './ProductsItemFields'
import { SlideItemFields } from './SlideItemFields'
import { SpotifyItemFields } from './SpotifyItemFields'
import { TextItemFields } from './TextItemFields'
import { VideoItemFields } from './VideoItemFields'
import { YoutubeItemFields } from './YoutubeItemFields'
import { Field } from './Field'

export function ItemTypeFields({
  item,
  isGridSection,
  onChange,
}: {
  item: SectionItem
  isGridSection: boolean
  onChange: (item: SectionItem) => void
}) {
  return (
    <>
      {'url' in item &&
        item.type !== 'video' &&
        item.type !== 'youtube-embed' &&
        item.type !== 'spotify-embed' && (
          <Field label="URL (opcional)">
            <input
              value={item.url}
              onChange={(e) => onChange({ ...item, url: e.target.value } as SectionItem)}
              placeholder="Deixe vazio para card sem link"
            />
          </Field>
        )}

      {item.type === 'text' && (
        <TextItemFields item={item} onChange={onChange} />
      )}
      {item.type === 'list' && (
        <ListItemFields item={item} onChange={onChange} />
      )}
      {item.type === 'whatsapp-hero' && (
        <WhatsAppHeroItemFields
          item={item}
          isGridSection={isGridSection}
          onChange={onChange}
        />
      )}
      {item.type === 'app-hero' && (
        <AppHeroItemFields item={item} isGridSection={isGridSection} onChange={onChange} />
      )}
      {item.type === 'feature' && (
        <FeatureItemFields item={item} isGridSection={isGridSection} onChange={onChange} />
      )}
      {item.type === 'link' && (
        <LinkItemFields item={item} isGridSection={isGridSection} onChange={onChange} />
      )}
      {item.type === 'video' && <VideoItemFields item={item} onChange={onChange} />}
      {item.type === 'slide' && <SlideItemFields item={item} onChange={onChange} />}
      {item.type === 'products' && <ProductsItemFields item={item} onChange={onChange} />}
      {item.type === 'youtube-embed' && <YoutubeItemFields item={item} onChange={onChange} />}
      {item.type === 'spotify-embed' && <SpotifyItemFields item={item} onChange={onChange} />}
      {item.type === 'grid' && <GridItemFields item={item} onChange={onChange} />}
      {item.type === 'location' && <LocationItemFields item={item} onChange={onChange} />}
    </>
  )
}
