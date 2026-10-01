(() => {
  'use strict';
  // Stable identifiers keep laboratory URLs independent of editable names.
  window.LAB_DEFINITIONS = [
    {
      id:'urban-cyber-physical-systems', name:'Urban Cyber-Physical Systems Team', code:'UCPS', color:'#6cf5cc',
      headline:'Connect the physical.\nUnderstand the digital.',
      introduction:'Exploring the connections between urban infrastructure, sensing and digital intelligence.',
      about:'This team explores how physical infrastructure and digital information can work together. Its research agenda connects sensing, urban digital twins and coordinated control to make complex city systems more understandable.',
      observatory:{title:'Sense, connect, respond.',description:'Explore illustrative relationships between sensor coverage, urban energy and mobility.'},
      scenarios:['sensing','energy','mobility'],
      research:[
        {title:'Urban sensing and data fusion',tag:'SENSING',summary:'Connect observations from buildings, streets and infrastructure into coherent urban information.',detail:'Research questions include sensor coverage, heterogeneous data alignment and the interpretation of incomplete observations.',keywords:'Urban sensing, Data fusion'},
        {title:'Urban digital twins',tag:'DIGITAL TWINS',summary:'Build interpretable connections between physical assets and their digital representations.',detail:'Explore how time-aware representations can support scenario comparison and the understanding of infrastructure behaviour.',keywords:'Digital twins, Spatial computing'},
        {title:'Coordinated infrastructure',tag:'SYSTEMS',summary:'Study how connected urban services can operate as interdependent systems.',detail:'Investigate coordination across sensing, communication and control, with attention to reliability and transparent decision-making.',keywords:'System integration, Resilience'}
      ]
    },
    {
      id:'transport-energy-networks', name:'Transport & Energy Networks Team', code:'TEN', color:'#81cbff',
      headline:'Move people.\nConnect energy.',
      introduction:'Studying the shared future of mobility, electric fleets and urban energy infrastructure.',
      about:'This team examines the interaction between transport demand and energy systems. Its research agenda covers electrified fleets, charging infrastructure and coordinated network planning, bringing mobility decisions into the wider energy transition.',
      observatory:{title:'Mobility meets energy.',description:'Compare illustrative mobility, energy and flexible-demand scenarios across a daily cycle.'},
      scenarios:['mobility','energy','economics'],
      research:[
        {title:'Electric fleets and charging',tag:'ELECTRIFICATION',summary:'Explore charging infrastructure and operating strategies for urban electric fleets.',detail:'Research questions connect fleet schedules, charging demand and the constraints of local electricity networks.',keywords:'Electric fleets, Charging'},
        {title:'Coupled network planning',tag:'NETWORKS',summary:'Consider transport networks and energy infrastructure within the same planning framework.',detail:'Explore how changes in mobility patterns affect energy needs, infrastructure access and network resilience.',keywords:'Network planning, Energy systems'},
        {title:'Sustainable urban logistics',tag:'LOGISTICS',summary:'Investigate the movement of goods and urban services under energy and service constraints.',detail:'Study the relationship between service allocation, vehicle routing and electrification in city logistics.',keywords:'Vehicle routing, Urban logistics'}
      ]
    },
    {
      id:'vehicle-cybersecurity', name:'Vehicle Cybersecurity Team', code:'VCS', color:'#ffc887',
      headline:'Connected mobility.\nTrust by design.',
      introduction:'Exploring resilient vehicle networks, trusted communication and the protection of connected mobility.',
      about:'This team focuses on the defensive security of connected vehicles and mobility infrastructure. Its research agenda examines trustworthy communication, anomaly monitoring and resilient system design across vehicles, roadside infrastructure and supporting services.',
      observatory:{title:'Explore system resilience.',description:'Use an illustrative model to examine defensive coverage, sensing and transport continuity. No real security assessment is performed.'},
      scenarios:['security','sensing','mobility'],
      research:[
        {title:'Trusted vehicle communication',tag:'TRUST',summary:'Study how connected vehicles and infrastructure can exchange information reliably.',detail:'Research questions include authentication, integrity and the coordination of trust across vehicle and infrastructure boundaries.',keywords:'V2X, Trusted communication'},
        {title:'Anomaly monitoring',tag:'MONITORING',summary:'Explore interpretable ways to identify unusual behaviour in vehicle networks.',detail:'Investigate monitoring coverage, uncertainty and human interpretation of defensive alerts without assuming that every anomaly is an attack.',keywords:'Detection, Interpretability'},
        {title:'Resilient mobility systems',tag:'RESILIENCE',summary:'Consider continuity and recovery when connected services become unavailable.',detail:'Explore graceful degradation, recovery planning and the relationship between cybersecurity and physical operations.',keywords:'Recovery, System assurance'}
      ]
    },
    {
      id:'future-sustainable-cities', name:'Future Sustainable Cities Team', code:'FSC', color:'#bbe78e',
      headline:'Live better.\nBuild within limits.',
      introduction:'Connecting urban ecology, low-carbon systems and everyday quality of life.',
      about:'This team explores urban futures that bring environmental sustainability and human needs together. Its research agenda covers urban climate, circular services and inclusive public space, with attention to the relationships between daily life and long-term change.',
      observatory:{title:'Explore a greener city.',description:'Compare illustrative green-space, clean-energy and public-transport scenarios.'},
      scenarios:['environment','energy','mobility'],
      research:[
        {title:'Urban climate and green space',tag:'URBAN ECOLOGY',summary:'Explore the contribution of blue-green infrastructure to everyday urban comfort.',detail:'Research questions connect land cover, heat exposure and access to green space while recognising local climatic differences.',keywords:'Urban climate, Green space'},
        {title:'Circular urban services',tag:'CIRCULARITY',summary:'Study the organisation of resource recovery and low-impact city services.',detail:'Explore how service design, collection logistics and resource flows can support more circular urban systems.',keywords:'Circular systems, Resource flows'},
        {title:'Inclusive urban futures',tag:'LIVEABILITY',summary:'Bring accessibility, public space and everyday experience into sustainability research.',detail:'Investigate who benefits from urban interventions and how environmental goals relate to shared quality of life.',keywords:'Accessibility, Public space'}
      ]
    },
    {
      id:'energy-economics-management', name:'Energy Economics & Management Team', code:'EEM', color:'#e8b8ef',
      headline:'Understand the trade-offs.\nManage the transition.',
      introduction:'Exploring the economic decisions, coordination and management behind changing energy systems.',
      about:'This team examines energy transitions through economics and management. Its research agenda connects flexible demand, resource allocation and transition governance, making assumptions and trade-offs explicit in decisions about urban energy.',
      observatory:{title:'Explore energy trade-offs.',description:'Compare illustrative operating-cost, clean-energy and demand scenarios. Results are not financial forecasts.'},
      scenarios:['economics','energy','mobility'],
      research:[
        {title:'Energy markets and flexibility',tag:'FLEXIBILITY',summary:'Explore the role of flexible demand in energy-system coordination.',detail:'Research questions connect operating choices, demand timing and the interpretation of economic incentives.',keywords:'Demand flexibility, Energy markets'},
        {title:'Transition decision-making',tag:'DECISIONS',summary:'Examine how assumptions and uncertainty shape energy-transition choices.',detail:'Compare transparent decision frameworks for balancing costs, environmental objectives and service needs.',keywords:'Decision analysis, Uncertainty'},
        {title:'Energy management and governance',tag:'MANAGEMENT',summary:'Study the organisation of energy resources across institutions and urban systems.',detail:'Explore resource coordination, organisational responsibilities and the evaluation of transition strategies.',keywords:'Energy management, Governance'}
      ]
    },
    {
      id:'clean-energy', name:'Clean Energy Team', code:'CEL', color:'#ffe17d',
      headline:'Cleaner sources.\nA connected energy future.',
      introduction:'Exploring renewable generation, energy storage and the integration of clean energy into everyday urban life.',
      about:'This team explores clean energy technologies and their integration into urban systems. Its research agenda connects renewable generation, energy storage and flexible demand, with attention to the coordination needed for a lower-carbon energy supply.',
      observatory:{title:'Explore a cleaner energy mix.',description:'Compare illustrative clean-energy, demand-flexibility and urban-environment scenarios.'},
      scenarios:['energy','economics','environment'],
      research:[
        {title:'Renewable energy integration',tag:'RENEWABLES',summary:'Explore how renewable generation can become part of coordinated urban energy systems.',detail:'Research questions connect generation variability, infrastructure constraints and the matching of clean supply with everyday demand.',keywords:'Renewable generation, Integration'},
        {title:'Energy storage and flexibility',tag:'STORAGE',summary:'Study the coordination of storage, demand flexibility and changing energy supply.',detail:'Explore how storage operation and demand timing interact with the availability of renewable energy.',keywords:'Energy storage, Flexible demand'},
        {title:'Low-carbon energy systems',tag:'CLEAN SYSTEMS',summary:'Connect clean energy choices with buildings, transport and shared urban infrastructure.',detail:'Examine system boundaries, transparent comparisons and the relationships between energy supply and urban service needs.',keywords:'Low-carbon systems, Urban energy'}
      ]
    }
  ];
})();
