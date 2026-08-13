import type { AppHero, FeatureCard, LinkCard, SectionItem, WhatsAppHero } from '@bio-types'
import { AppHeroItemFields, WhatsAppHeroItemFields } from './AppHeroItemFields'
import { FeatureItemFields } from './FeatureItemFields'
import { GridItemFields } from './GridItemFields'
import { LinkItemFields } from './LinkItemFields'
import { ListItemFields } from './ListItemFields'
import { LocationItemFields } from './LocationItemFields'
import { PressItemFields } from './PressItemFields'
import { ProductsItemFields } from './ProductsItemFields'
import { SlideItemFields } from './SlideItemFields'
import { SpotifyItemFields } from './SpotifyItemFields'
import { TextItemFields } from './TextItemFields'
import { VideoItemFields } from './VideoItemFields'
import { YoutubeItemFields } from './YoutubeItemFields'
import { Field } from './Field'
import { CardActionField, urlFieldLabel, urlFieldPlaceholder } from './CardActionField'

type CardActionItem = FeatureCard | AppHero | WhatsAppHero | LinkCard

function supportsCardAction(item: SectionItem): item is CardActionItem {
  return (
    item.type === 'feature' ||
    item.type === 'app-hero' ||
    item.type === 'whatsapp-hero' ||
    item.type === 'link'
  )
}

export function ItemTypeFields({
  item,
  isGridSection,
  onChange,
}: {
  item: SectionItem
  isGridSection: boolean
  onChange: (item: SectionItem) => void
}) {
  const withAction = supportsCardAction(item)

  return (
    <>
      {withAction && (
        <CardActionField
          value={item.action}
          url={item.url}
          onChange={(action) => onChange({ ...item, action })}
        />
      )}

      {'url' in item &&
        item.type !== 'video' &&
        item.type !== 'youtube-embed' &&
        item.type !== 'spotify-embed' && (
          <Field label={withAction ? urlFieldLabel(item.action) : 'URL (opcional)'}>
            <input
              value={item.url}
              onChange={(e) => onChange({ ...item, url: e.target.value } as SectionItem)}
              placeholder={
                withAction ? urlFieldPlaceholder(item.action) : 'Deixe vazio para card sem link'
              }
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
      {item.type === 'press' && (
        <PressItemFields item={item} isGridSection={isGridSection} onChange={onChange} />
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
