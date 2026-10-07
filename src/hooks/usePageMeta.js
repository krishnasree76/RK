import { useEffect } from 'react'

const DEFAULT_TITLE = 'RK ENTERPRICES DELHI | Wholesale Car Accessories'

function setMetaDescription(content) {
  let tag = document.querySelector('meta[name="description"]')
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', 'description')
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

// Sets the document title and meta description for the current page.
export default function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title || DEFAULT_TITLE
    if (description) setMetaDescription(description)
  }, [title, description])
}
