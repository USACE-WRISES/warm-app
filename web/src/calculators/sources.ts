// The source documents, as the ERDC technical note's bibliography cites them (ERDC/TN EMRRP-RQ-7,
// pages 10 and 11), with the links it gives.

const LIBRARY = 'https://ecolibrary.sec.usace.army.mil/'

export const SOURCES = {
  bosque: { text: 'Burks-Copes, K. A., and A. C. Webb. 2012. A Bosque Riparian Community Index Model for the Middle Rio Grande, Albuquerque, New Mexico: Model Documentation. ERDC/EL TR-12-26. US Army Engineer Research and Development Center.', url: 'https://hdl.handle.net/11681/7166' },
  chatfield: { text: 'ERO Resources Corporation. 2009. Ecological Functions Approach for Terrestrial Habitats at Chatfield Reservoir. ERO Project #4048. ERO Resources Corporation.', url: LIBRARY },
  cottonwood: { text: 'Burks-Copes, K. A. 2016. A Community-Based Ecosystem Response Model for the Cottonwood Riparian Forests of the Missouri River: Model Documentation. ERDC/EL Final Report. US Army Engineer Research and Development Center.', url: LIBRARY },
  lowerWillamette: { text: 'Tetra Tech, Inc. 2014. Lower Willamette River Ecosystem Restoration Project, Appendix F: Habitat Evaluation Model Planning Models Documentation. Tetra Tech, Inc.', url: LIBRARY },
  minkModified: { text: 'Devendorf, R., and T. Yager. 2013. Modification of the Riverine Cover Type Component of the Habitat Suitability Index Model for Mink. March 2001, updated October 2013. US Army Corps of Engineers, St. Paul District.', url: LIBRARY },
  minkAllen: { text: 'Allen, A. W. 1986. Habitat Suitability Index Models: Mink, Revised. U.S. Fish and Wildlife Service Biological Report 82(10.127).' },
  resaca: { text: 'USACE Galveston District. 2017. Resaca Reference Condition Model Documentation, Lower Rio Grande Valley, Cameron and Hidalgo Counties, Texas: Brownsville Resaca Ecosystem Restoration Study. US Army Corps of Engineers.' },
  smurf: { text: 'McKay, S. K., M. Goss, F. Veraldi, and L. Mattingly. In review. Simple Model for Urban Riparian Function (SMURF), Version 1.0. Internal Report. US Army Corps of Engineers, Louisville District.' },
  skokomish: { text: 'Klimas, C., B. Yuill, N. Gleason, C. Barrow, and F. Goetz. 2013. Skokomish River Ecosystem Restoration Project Environmental Benefits Analysis. US Army Engineer Research and Development Center and US Army Corps of Engineers, Seattle District.', url: LIBRARY },
  upperMississippi: { text: 'USACE (US Army Corps of Engineers). 2021. Upper Mississippi River System Floodplain Forest Habitat Model. USACE St. Paul District, Rock Island District, and St. Louis District.', url: LIBRARY },
  review: { text: 'Wiest, S., D. Hernandez-Abrams, and S. K. McKay. 2023. Review of Riparian Models for Assessing Ecological Impacts and Benefits. ERDC/TN EMRRP-ER-26. US Army Engineer Research and Development Center.', url: 'https://dx.doi.org/10.21079/11681/47706' },
  inspire: { text: 'Shaw, C. K., and S. R. Wiest. 2023. Increasing Accessibility of Riparian Assessment Tools Through Web Applications. In ASCE Inspire 2023, 199-207. American Society of Civil Engineers.', url: 'https://doi.org/10.1061/9780784485163.024' },
} as const
