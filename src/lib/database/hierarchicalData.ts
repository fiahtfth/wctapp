export interface Subtopic {
    name: string;
    microtopics?: string[];
    subtopics?: string[];
}
export interface Topic {
    name: string;
    subtopics: Subtopic[];
}
export interface Module {
    name: string;
    topics: Topic[];
}
export interface Subject {
    name: string;
    modules: Module[];
}
const hierarchicalData: Subject[] = [
    {
        "name": "Economics",
        "modules": [
            {
                "name": "Module_1",
                "topics": [
                    {
                        "name": "Introduction to Economics",
                        "subtopics": [
                            { name: "Concept of Demand" },
                            { name: "Sectors of Economy" },
                            { name: "Concept of Supply" },
                            { name: "Basics" }
                        ]
                    },
                    {
                        "name": "Inclusive Growth",
                        "subtopics": [
                            { "name": "Economic Growth" },
                            { "name": "Measures for Inclusive Growth" },
                            { "name": "Sustainable Development" },
                            { "name": "Growth Vs Development" },
                            { "name": "Inclusive Growth Components" },
                            { "name": "Human Development Approaches" },
                            { "name": "Government Schemes" },
                            { "name": "Financial Inclusion Schemes" }
                        ]
                    },
                    {
                        "name": "Planning in India",
                        "subtopics": [
                            { "name": "1991 Economic Crisis" },
                            { "name": "Different Types of Planning" },
                            { "name": "Structural Backwardness" },
                            { "name": "Five year Plans" },
                            { "name": "Infrastructure" },
                            { "name": "Import Substitution" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_2",
                "topics": [
                    {
                        "name": "National Income",
                        "subtopics": [
                            { "name": "Concept of GDP and GNP" },
                            { "name": "Concept of National Income" },
                            { "name": "Gross Value Added(GVA)" },
                            { "name": "Purchasing Power Parity" },
                            { "name": "Gross national Income" },
                            { "name": "Growth Calculation in India" },
                            { "name": "Demographic Dividend" },
                            { "name": "Concept of GDP and GNP(At Market Price and Factor Cost)" },
                            { "name": "GDP" }
                        ]
                    },
                    {
                        "name": "Balance of Payments",
                        "subtopics": [
                            { "name": "Balance of Payment Concept" },
                            { "name": "Current Account and Capital Accounts" },
                            { "name": "Foreign Trade" },
                            { "name": "Balance of Trade" },
                            { "name": "FDI, FII in Indian context" }
                        ]
                    },
                    {
                        "name": "Foreign Exchange Rates",
                        "subtopics": [
                            { "name": "Foreign Exchange Reserves" },
                            { "name": "Foreign Exchange Rates" }
                        ]
                    },
                    {
                        "name": "Exchange rate",
                        "subtopics": [
                            { "name": "Foreign Exchange Rates" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_3",
                "topics": [
                    {
                        "name": "Economic Reforms including Industrial Economics",
                        "subtopics": [
                            { "name": "Disivestment/ Privatisation" },
                            { "name": "Manufacturing" },
                            { "name": "Economic reforms" },
                            { "name": "Public sector reforms" },
                            { "name": "Industrial Economics" },
                            { "name": "Cyclical Management" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_4",
                "topics": [
                    {
                        "name": "Fiscal Policy",
                        "subtopics": [
                            { "name": "Taxation in India" },
                            { "name": "Union Budget" },
                            { "name": "Capital and Revenue- Receipts and Expenditure" },
                            { "name": "Public debt" },
                            { "name": "Fiscal Consolidation" },
                            { "name": "FRBM Act" }
                        ]
                    },
                    {
                        "name": "Inflation",
                        "subtopics": [
                            { "name": "Disinflation" },
                            { "name": "Inflation-Effects" },
                            { "name": "Inflation-Measurement in India" },
                            { "name": "Philips Curve" },
                            { "name": "Stagflation" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_5",
                "topics": [
                    {
                        "name": "International Institutions- IMF and World bank",
                        "subtopics": [
                            { "name": "IMF" },
                            { "name": "World Bank" },
                            { "name": "Washington Consensus" }
                        ]
                    },
                    {
                        "name": "Financial Market",
                        "subtopics": [
                            { "name": "Debt Instrument" },
                            { "name": "G- Secs" },
                            { "name": "Type of Funds" },
                            { "name": "Foreign Investors" },
                            { "name": "Primary & Secondary Market" },
                            { "name": "Money and Capital Market Instruments" },
                            { "name": "Money market- debt instruments" },
                            { "name": "SEBI" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_6",
                "topics": [
                    {
                        "name": "Monetary System",
                        "subtopics": [
                            { "name": "NFRA" },
                            { "name": "Money & Banking" },
                            { "name": "Quantitative Tools of Monetary Policy" },
                            { "name": "Quantitative & Qualitative Tools of Monetary Policy" },
                            { "name": "Tools of Monetary Policy" },
                            { "name": "Money n Money Supply" },
                            { "name": "Monetary Policy Committee" },
                            { "name": "Public Debt Managment Agency" },
                            { "name": "Monetary Policy Committees" }
                        ]
                    },
                    {
                        "name": "Banking in India",
                        "subtopics": [
                            { "name": "Money and Banking" },
                            { "name": "Money & Banking" },
                            { "name": "Non Performing Assests" },
                            { "name": "Challenges & reforms in banking/ Steps taken by Govt to reduce NPA" },
                            { "name": "Reserve bank of india" },
                            { "name": "Commercia Banks" },
                            { "name": "NBFC" },
                            { "name": "RBI" },
                            { "name": "Qualitative tools of Money Supply" }
                        ]
                    },
                    {
                        "name": "Infrastructure Sector and Energy",
                        "subtopics": [
                            { "name": "Industry Sector" },
                            { "name": "Public Private Partnership" },
                            { "name": "Ports" },
                            { "name": "National Infrastructure and Investment Fund" },
                            { "name": "Infrastructure" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_7",
                "topics": [
                    {
                        "name": "Agriculture and Allied Activities",
                        "subtopics": [
                            { "name": "Agriculture" },
                            { "name": "Agriculture Subsidy" },
                            { "name": "Agriculture  Related Schemes" },
                            { "name": "Agriculture and other Schemes" },
                            { "name": "Pricing in Agriculture: Concept of MSP, Procurement and Issue Price" },
                            { "name": "Agricultural subsidy" },
                            { "name": "Indian agriculture" },
                            { "name": "Agricultural/ farm Subsidy" },
                            { "name": "Role of Public Investment in Agriculture" }
                        ]
                    },
                    {
                        "name": "Poverty, Inequality and Unemployment",
                        "subtopics": [
                            { "name": "Poverty" },
                            { "name": "Multi-Dimensional Poverty Index" },
                            { "name": "Unemployment" }
                        ]
                    }
                ]
            }
        ]
    },
    {
        "name": "History",
        "modules": [
            {
                "name": "Ancient History and Culture_1",
                "topics": [
                    {
                        "name": "Ancient History",
                        "subtopics": [
                            { "name": "Indus valley civilization" },
                            { "name": "Mauryan Empire" },
                            { "name": "Vedic Period" },
                            { "name": "Gupta Period" },
                            { "name": "Prehistoric Cultures" },
                            { "name": "Mahajanapadas" }
                        ]
                    }
                ]
            },
            {
                "name": "Ancient History and Culture_2",
                "topics": [
                    {
                        "name": "Ancient History",
                        "subtopics": [
                            { "name": "Post Mauryan Period" },
                            { "name": "Sangam Age" },
                            { "name": "Art and Architecture" }
                        ]
                    }
                ]
            },
            {
                "name": "Medieval History",
                "topics": [
                    {
                        "name": "Medieval India",
                        "subtopics": [
                            { "name": "Delhi Sultanate" },
                            { "name": "Mughal Empire" },
                            { "name": "Vijayanagara Empire" },
                            { "name": "Bhakti and Sufi Movements" }
                        ]
                    }
                ]
            },
            {
                "name": "Modern History_1",
                "topics": [
                    {
                        "name": "Modern India",
                        "subtopics": [
                            { "name": "British Expansion" },
                            { "name": "Revolt of 1857" },
                            { "name": "Indian National Movement" }
                        ]
                    }
                ]
            },
            {
                "name": "Modern History_2",
                "topics": [
                    {
                        "name": "Modern India",
                        "subtopics": [
                            { "name": "Gandhian Era" },
                            { "name": "Constitutional Development" },
                            { "name": "Post Independence Era" }
                        ]
                    }
                ]
            }
        ]
    },
    {
        "name": "Geography",
        "modules": [
            {
                "name": "Indian Geography_1",
                "topics": [
                    {
                        "name": "Indian Location and Setting",
                        "subtopics": [
                            { "name": "Location,Size and Time Zone" },
                            { "name": "Northern Mountains/Himalayas" },
                            { "name": "Great plains-Indo- Gangetic plains" },
                            { "name": "Coastal Plains & Islands" },
                            { "name": "North Eastern Hills and Mountains" },
                            { "name": "Peninsular Pleateau" },
                            { "name": "Thar Desert" }
                        ]
                    }
                ]
            },
            {
                "name": "Indian Geography_2",
                "topics": [
                    {
                        "name": "Indian Climate",
                        "subtopics": [
                            { "name": "Monsoon Climate" },
                            { "name": "Tropical Cyclone" },
                            { "name": "Factors Influencing Indian Monsoon-MJO" },
                            { "name": "Characteristics of Indian Monsoon" },
                            { "name": "Factors Influencing Indian Monsoon" },
                            { "name": "Seasons in India" },
                            { "name": "Factors influencing Indian Monsoon" },
                            { "name": "Indian Monsoon--Role of Jet Streams" }
                        ]
                    },
                    {
                        "name": "Indian Drainage System",
                        "subtopics": [
                            { "name": "Division of Indian Drainage System" },
                            { "name": "Himalayan Rivers" },
                            { "name": "Peninsular Rivers" },
                            { "name": "Himalayan Rivers and Peninsular Rivers Comparison" },
                            { "name": "Interlinking of Rivers" },
                            { "name": "Peninsular Rivers--Chambal" }
                        ]
                    },
                    {
                        "name": "Natural Vegetation of India",
                        "subtopics": [
                            { "name": "Tropical Evergreen Forest" },
                            { "name": "Types of Forests and their Distribution" }
                        ]
                    }
                ]
            },
            {
                "name": "Indian Geography_3",
                "topics": [
                    {
                        "name": "Mineral Resources--India",
                        "subtopics": [
                            { "name": "Metallic and Non-Metallic Minerals" },
                            { "name": "Energy Resource-Coal" },
                            { "name": "Mineral Rocks" }
                        ]
                    },
                    {
                        "name": "Indian Agriculture",
                        "subtopics": [
                            { "name": "Major Crops in Various Parts of the Country" },
                            { "name": "Green Revolution" },
                            { "name": "Plantation Crops in India-Tea" },
                            { "name": "Zero Budget Natural Farming" },
                            { "name": "Jute Cultivation" },
                            { "name": "Challenges and problems of Indian agriculture" },
                            { "name": "Government Schemes for Agriculture" }
                        ]
                    },
                    {
                        "name": "Indian Soils",
                        "subtopics": [
                            { "name": "Soil Erosion and Land Degradation" },
                            { "name": "Types of Soil and Their Nutrients" },
                            { "name": "Soil Formation- Processes and Factors" },
                            { "name": "Types of Soils n their Characteristics" },
                            { "name": "Institutions For Soil Research" },
                            { "name": "Peaty Soil" },
                            { "name": "Types of Soil n their Distribution" },
                            { "name": "Laterite Soil" }
                        ]
                    },
                    {
                        "name": "Transportation in India",
                        "subtopics": [
                            { "name": "Railways" },
                            { "name": "Waterways" }
                        ]
                    }
                ]
            },
            {
                "name": "Physical Geography_1",
                "topics": [
                    {
                        "name": "Geomorphology",
                        "subtopics": [
                            { name: "Continental Drift Theory" },
                            { name: "Plate Tectonic Theory" },
                            { name: "Earths Interior/Evolution of Earth" },
                            { name: "Earths Interior" },
                            { name: "Earthquakes and Volcanism" },
                            { name: "Formation of Stars" },
                            { name: "Solar System" },
                            { name: "Earth's Interior" },
                            { name: "Volcanic Landforms" },
                            { name: "Geomorphic Processes" },
                            { name: "Mountain Buiding" },
                            { name: "Fluvial Landforms" }
                        ]
                    },
                    {
                        "name": "Oceanography",
                        "subtopics": [
                            { name: "Ocean Currents/Ocean Circulation" },
                            { name: "Marine Resources-Corals" },
                            { name: "Ocean Zoning" },
                            { name: "Temperature of Ocean Waters" },
                            { name: "Salinity of Ocean Waters" },
                            { name: "Ocean Circulation-La Nina El Nino" }
                        ]
                    }
                ]
            },
            {
                "name": "Physical Geography_2",
                "topics": [
                    {
                        "name": "Climatology",
                        "subtopics": [
                            { name: "Atmospheric Circulation-Coriolis Force" },
                            { name: "Distribution of Temperature andThermal Belts" },
                            { name: "Clouds and Distribution of Precipitation" },
                            { name: "Atmosphere-Origin, Composition and Structure" },
                            { name: "Atmospheric Circulation--Seasonal and Local Winds" },
                            { name: "Cyclone and Anti Cyclone" },
                            { name: "Air Mass and Fronts" },
                            { name: "Atmospheric Circulation--Jet Streams" },
                            { name: "Distribution of Temperature andThermal Belts--Insolation" },
                            { name: "Atmospheric Circulation--Trade Winds" },
                            { name: "Distribution of Temperature and Thermal Belts" },
                            { name: "Distribution of Temperature andThermal Belts-Temperature Inversion" },
                            { name: "Distribution of Temperature andThermal Belts- Lapse Rate" },
                            { name: "Distribution of Temperature andThermal Belts- Albedo Effect" },
                            { name: "Clouds and Distribution of Precipitation--Types of Clouds" },
                            { name: "Distribution of Temperature andThermal Belts--Local Winds" },
                            { name: "Distribution of Temperature andThermal Belts--Eccnetricity of Earth" }
                        ]
                    }
                ]
            },
            {
                "name": "World Geography",
                "topics": [
                    {
                        "name": "Global Distribution of Physical Features and Resources",
                        "subtopics": [
                            { name: "Malacca Strait" },
                            { name: "Location of Ocean Trenches" },
                            { name: "Antarctica n Southern Ocean" },
                            { name: "Active Volcanoes of the World" },
                            { name: "Strait and Gulfs" },
                            { name: "Population Growth" }
                        ]
                    },
                    {
                        "name": "World Agriculture and Industry",
                        "subtopics": [
                            { "name": "Agriculture Density" },
                            { "name": "Rice Cultivation" }
                        ]
                    },
                    {
                        "name": "Mapping",
                        "subtopics": [
                            { "name": "Europe" },
                            { "name": "Asia Africa" },
                            { "name": "South East Asia--South China Sea" },
                            { "name": "Africa--Nile River" },
                            { "name": "Berring Strait" },
                            { "name": "Africa" },
                            { "name": "Australia" },
                            { "name": "North America" },
                            { "name": "South America" },
                            { "name": "Asia" }
                        ]
                    }
                ]
            }
        ]
    },
    {
        "name": "Polity and Governance",
        "modules": [
            {
                "name": "Module_1",
                "topics": [
                    {
                        "name": "Introduction to the Constitution",
                        "subtopics": [
                            { name: "Constituent Assembly" },
                            { name: "Systems of the Government" },
                            { name: "Constitution--Salient Features" },
                            { name: "Constitution--Schedules" },
                            { name: "The Rule of Law" },
                            { name: "Constitutionalism" }
                        ]
                    },
                    {
                        "name": "Preamble and its Values",
                        "subtopics": [
                            { name: "Objectives of the Preamble" },
                            { name: "Preamble--Important Amendments" },
                            { name: "Sources of the Preamble" },
                            { name: "Features of the Preamble" },
                            { name: "Values and Aspiration in the Preamble" },
                            { name: "Indian Democratic Political System" },
                            { name: "Preamble--Important Cases" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_2",
                "topics": [
                    {
                        "name": "Fundamental Rights",
                        "subtopics": [
                            { name: "Right ot Equality --Article 15" },
                            { name: "Right to Freedom of Religion" },
                            { name: "Right to Freedom of Profession- Aticle 19" },
                            { name: "Right to Life and Liberty" },
                            { name: "Protection Against Arrest and Detention (Article 22)" },
                            { name: "Right to Constitutional Remedies--Writs" },
                            { name: "Fundamental Rights--Features" },
                            { name: "Rights Available to Foreigners" },
                            { name: "Fundamental Rights-- Reasonable Restrictions" },
                            { name: "Equal Protection of Law" },
                            { name: "Right to Equality-- Article 14 and 15" },
                            { name: "Right to Equality-- Article 14 --18" },
                            { name: "Right to Equality-- Article 16" },
                            { name: "FR-DPSP Inter relations" }
                        ]
                    },
                    {
                        "name": "Fundamental Rights-",
                        "subtopics": [
                            { "name": "Definition of State" }
                        ]
                    },
                    {
                        "name": "Fundamental Rights- Part A",
                        "subtopics": [
                            { "name": "Features of Fundamental Rights" },
                            { "name": "Basic Structure Doctrine" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_3",
                "topics": [
                    {
                        "name": "Fundamental Duties",
                        "subtopics": [
                            { "name": "Fundamental Duties" },
                            { "name": "Fundamental Duties--Important Provisions" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_4",
                "topics": [
                    {
                        "name": "The Union and its territories.",
                        "subtopics": [
                            { "name": "Provisions of Article 1" },
                            { "name": "Provisions of Article 3" },
                            { "name": "Territory of India and Union of India" },
                            { "name": "Formation of New States" },
                            { "name": "Constitutional Provisions" },
                            { "name": "Union of States" }
                        ]
                    },
                    {
                        "name": "Judiciary",
                        "subtopics": [
                            { "name": "Supreme Court- Advisory Jurisdiction" },
                            { "name": "Supreme Court- Composition" },
                            { "name": "Supreme Court- Court of Record" },
                            { "name": "Supreme Court- Original Jurisdiction" },
                            { "name": "Supreme Court- Establishment" },
                            { "name": "Supreme Court- Seat" },
                            { "name": "Judiciary" },
                            { "name": "Supreme Court- Judges salary n Jurisdicition" },
                            { "name": "Supreme Court- Jurisdicition" },
                            { "name": "Tribunals" },
                            { "name": "Supreme Court- Removal of Judges" },
                            { "name": "Supreme Court- Original  Jurisdiction" },
                            { "name": "Supreme Court--Judges Oath" },
                            { "name": "High Court- Judges Qualification" },
                            { "name": "Supreme Court- Judges Number" },
                            { "name": "Alternative Dispute Resolution--Gram Nyayalayas" },
                            { "name": "High Court -- Judges Appointment" },
                            { "name": "High Court" }
                        ]
                    },
                    {
                        "name": "Citizenship",
                        "subtopics": [
                            { "name": "Termination of Citizenship" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_5",
                "topics": [
                    {
                        "name": "Union and State Executive",
                        "subtopics": [
                            { "name": "President of India / Governor of State" },
                            { "name": "President of India-- Election" },
                            { "name": "Prime Minister of India" },
                            { "name": "President of India--   Veto Powers" },
                            { "name": "Governor of the State" },
                            { "name": "President of India-- Pardoning Power" },
                            { "name": "President of India-- Legislative Powers" },
                            { "name": "President of India-- Diplomatic Powers/Military Powers" },
                            { "name": "President of India-Governor of the State-- Powers" },
                            { "name": "PM and Council of Ministers" },
                            { "name": "President of India-- Impeachment" },
                            { "name": "Cabinet Committees" },
                            { "name": "President of India-- Executive Powers" },
                            { "name": "Vice President of India-- Election" },
                            { "name": "Vice President of India-- Functions and powers" },
                            { "name": "Vice President of India-- Removal" }
                        ]
                    },
                    {
                        "name": "ECI and RPA",
                        "subtopics": [
                            { "name": "Anti Defection Law" },
                            { "name": "Election Commissioner Removal" },
                            { "name": "State Election Commission" }
                        ]
                    },
                    {
                        "name": "Constitutional Bodies /Statutory Bodies",
                        "subtopics": [
                            { "name": "Delimitation Commission" },
                            { "name": "UPSC" },
                            { "name": "Joint State Public Service Commission" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_6",
                "topics": [
                    {
                        "name": "Union and State Legislature",
                        "subtopics": [
                            { "name": "Financial Relation betwen Centre and State" },
                            { "name": "Member of Parliament   \nQualification/Disqualification" },
                            { "name": "Parliament-- Legislative Jurisdiction" },
                            { "name": "Parliamentary Committees" },
                            { "name": "Parliament-- Legislative Procedure" },
                            { "name": "Parliament-- Transaction of Business" },
                            { "name": "Parliament Procedures-- Types of majority" },
                            { "name": "Parliamentary Procedure-- No Confidence Motion" },
                            { "name": "Parliament-- Legislative Procedure--Money Bill" },
                            { "name": "Parliament-- Speaker of the Lok Sabha" },
                            { "name": "Parliament-- Speaker of the Lok Sabha--Election" },
                            { "name": "Parliamentary Procedure" }
                        ]
                    },
                    {
                        "name": "Emergency Provisions",
                        "subtopics": [
                            { "name": "National Emergency--Proclaimation" },
                            { "name": "National Emergency-Approval and Effects" },
                            { "name": "National Emergency- Related Amendments" },
                            { "name": "Financial Emergency" }
                        ]
                    },
                    {
                        "name": "Local Self Government",
                        "subtopics": [
                            { "name": "Panchayats (Extension to the Scheduled Areas) Act" },
                            { "name": "Gram Sabha" },
                            { "name": "73rd Constitutional Amendment" },
                            { "name": "Fifth Schedule Areas" }
                        ]
                    },
                    {
                        "name": "Federalism and Centre-State Relations",
                        "subtopics": [
                            { "name": "Federalism-- Concepts" },
                            { "name": "7th Constitutional Amendment" }
                        ]
                    }
                ]
            }
        ]
    },
    {
        "name": "Science and Technology",
        "modules": [
            {
                "name": "Module_1",
                "topics": [
                    {
                        "name": "Nuclear Energy",
                        "subtopics": [
                            { "name": "Nuclear Energy-- Related Legislations" },
                            { "name": "Nuclear Energy-- Basics" },
                            { "name": "Nuclear Weapons Programme--CTBT" },
                            { "name": "Uranium Enrichment" },
                            { "name": "Nuclear Power Programme" },
                            { "name": "Basics-- Fission Power" },
                            { "name": "Nuclear Weapons Programme--NPT" },
                            { "name": "Nuclear Cooperation Agreements" },
                            { "name": "Fusion Power" }
                        ]
                    },
                    {
                        "name": "Miscellaneous",
                        "subtopics": [
                            { "name": "Critical Minerals" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_2",
                "topics": [
                    {
                        "name": "Space",
                        "subtopics": [
                            { "name": "Space Missions" },
                            { "name": "Dark Matter n Dark Energy" },
                            { "name": "Standard Model of Physics" },
                            { "name": "Rockets, Jets and Satellites" },
                            { "name": "Miscellaneous" }
                        ]
                    },
                    {
                        "name": "Standard Model of Physics",
                        "subtopics": [
                            { "name": "Neutrino" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_3",
                "topics": [
                    {
                        "name": "Health",
                        "subtopics": [
                            { "name": "Antibiotic Resistance" },
                            { "name": "Diagnostic Tests" },
                            { "name": "DNA Computers" },
                            { "name": "DNA Technology" },
                            { "name": "Disease Control Programmes" },
                            { "name": "Scheduled Drugs" },
                            { "name": "Viral Diseases" },
                            { "name": "Viral Diseases- Hepatitis B" },
                            { "name": "Viral Diseases--Polio" },
                            { "name": "Vaccines" }
                        ]
                    },
                    {
                        "name": "Issues with IPR",
                        "subtopics": [
                            { "name": "Biopiracy" },
                            { "name": "Evergreening" },
                            { "name": "TRIPS Plus" },
                            { "name": "Compulsory Licencing" },
                            { "name": "Data Exclusivity" },
                            { "name": "TRIPS" }
                        ]
                    },
                    {
                        "name": "Biotechnology",
                        "subtopics": [
                            { "name": "Genome Editing" },
                            { "name": "DNA Profiling" },
                            { "name": "Genetically Modified Crops" },
                            { "name": "Genetically Modified Organisms" },
                            { "name": "GM Labelling of Food Products" },
                            { "name": "Gene Therapy" },
                            { "name": "IndiGen Project" },
                            { "name": "Genetic use restriction technologies (GURTs)" },
                            { "name": "Human Genome Project--Write" },
                            { "name": "Stem Cells" },
                            { "name": "Gene Editing" }
                        ]
                    },
                    {
                        "name": "Defence",
                        "subtopics": [
                            { "name": "Missiles" },
                            { "name": "Missile Technology Control Regime" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_4",
                "topics": [
                    {
                        "name": "Information Technology",
                        "subtopics": [
                            { "name": "5G Technology" },
                            { "name": "Quantam Computing" },
                            { "name": "Internet of Things" },
                            { "name": "Net Neutrality" },
                            { "name": "Non Fugible Token/Cryptocurrency" },
                            { "name": "Cryptocurrencey" },
                            { "name": "Spiking Neural Network" },
                            { "name": "Supercomputer" },
                            { "name": "Bharatnet" }
                        ]
                    },
                    {
                        "name": "Nanotechnology",
                        "subtopics": [
                            { "name": "Graphene" }
                        ]
                    },
                    {
                        "name": "nan",
                        "subtopics": []
                    },
                    {
                        "name": "Non Nuclear Energy",
                        "subtopics": [
                            { "name": "Flu Gas Desulphurization" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_5",
                "topics": [
                    {
                        "name": "Genetics",
                        "subtopics": [
                            { "name": "DNA" },
                            { "name": "DNA and RNA" },
                            { "name": "Sex Linked Recessive Disorder" },
                            { "name": "Chromozomal Abberations" }
                        ]
                    },
                    {
                        "name": "Cell Biology",
                        "subtopics": [
                            { "name": "Stem Cells" }
                        ]
                    },
                    {
                        "name": "Gravitation",
                        "subtopics": [
                            { "name": "Langarage Points" }
                        ]
                    },
                    {
                        "name": "States of Matter",
                        "subtopics": [
                            { "name": "Plasma State" }
                        ]
                    },
                    {
                        "name": "Biology",
                        "subtopics": [
                            { "name": "Cell Biology" }
                        ]
                    },
                    {
                        "name": "Human Body Systems",
                        "subtopics": [
                            { "name": "Antibody and Immunoglobulins" },
                            { "name": "Viral Diseases" },
                            { "name": "Non- Communicable Diseases" },
                            { "name": "Types of Masks" },
                            { "name": "Platelets" },
                            { "name": "Liver" },
                            { "name": "Protozoan Disease- Malaria" },
                            { "name": "Blood Group" },
                            { "name": "Endocrine Glands" }
                        ]
                    },
                    {
                        "name": "Plant Kingdom",
                        "subtopics": [
                            { "name": "Nitrogen Fixation" },
                            { "name": "Ethylene Role in Plant Growth" },
                            { "name": "Essential Micronutrienets for Plants" }
                        ]
                    },
                    {
                        "name": "Diversity in the Living World",
                        "subtopics": [
                            { "name": "Prokaryotic Organisms" },
                            { "name": "Bacteria" }
                        ]
                    },
                    {
                        "name": "Biomolecules",
                        "subtopics": [
                            { "name": "Fatty Acids" },
                            { "name": "Micro and Macro Nutrients" },
                            { "name": "Vitamins" },
                            { "name": "Sugars" },
                            { "name": "Unsaturated Fatty Acids and Polysaccharides" }
                        ]
                    },
                    {
                        "name": "Chemistry",
                        "subtopics": [
                            { "name": "Organocatalyst" },
                            { "name": "Specific Heat Of Substance" }
                        ]
                    },
                    {
                        "name": "Light and its Properties",
                        "subtopics": [
                            { "name": "Concave Mirrors" },
                            { "name": "Refraction of Light" }
                        ]
                    },
                    {
                        "name": "Wave Motion",
                        "subtopics": [
                            { "name": "Sound Waves" },
                            { "name": "Surface Waves" }
                        ]
                    },
                    {
                        "name": "Electromagnetic Waves",
                        "subtopics": [
                            { "name": "Electromagnetic Spectrum" }
                        ]
                    }
                ]
            }
        ]
    },
    {
        "name": "Ecology and Environment",
        "modules": [
            {
                "name": "Module_1",
                "topics": [
                    {
                        "name": "Ecology and Environment--Basic Concepts",
                        "subtopics": [
                            { "name": "Ecology" },
                            { "name": "Ecology and Ecosystem" },
                            { "name": "Ecological Hierarchy" },
                            { "name": "Ecological Niche and Ecotone" },
                            { "name": "Ecotone" },
                            { "name": "Edge Effect" },
                            { "name": "Biotic Interactions" },
                            { "name": "Food Chain" },
                            { "name": "Gause's Principle of Competitive Exclusion" },
                            { "name": "Ecological Pyramids" },
                            { "name": "Keystone Species" },
                            { "name": "Species Diversity" },
                            { "name": "Allelopathy" },
                            { "name": "Adaptive Mechanisms" },
                            { "name": "Ecological Succession" }
                        ]
                    },
                    {
                        "name": "Biodiversity",
                        "subtopics": [
                            { "name": "Algae" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_2",
                "topics": [
                    {
                        "name": "Ecology and Environment--Basic Concepts",
                        "subtopics": [
                            { "name": "Biogeochemical Cycles" },
                            { "name": "Biogeochemical Cycles--Carbon Cycle" },
                            { "name": "Ecological Succession" },
                            { "name": "Ecogeographical rules" },
                            { "name": "Ecosystem Productivity" },
                            { "name": "Aquatic Ecosystem" },
                            { "name": "Ecotone and Edge Effect" },
                            { "name": "Ecological Succession--Sere" },
                            { "name": "Ecotone" }
                        ]
                    },
                    {
                        "name": "Biodiversity",
                        "subtopics": [
                            { "name": "Ecosystem Diversity--Tropical Moist Deciduous Forest" },
                            { "name": "Desert Ecosystem--Adaptations" },
                            { "name": "Types of Bio-diversity" },
                            { "name": "Bodiversity Gradients" },
                            { "name": "Levels of Biodiversity" },
                            { "name": "Species Diversity" }
                        ]
                    },
                    {
                        "name": "Biodiversity Conservation",
                        "subtopics": [
                            { "name": "Ex-situ Conservation" },
                            { "name": "IUCN Classification" },
                            { "name": "Biodiversity Hotspot" },
                            { "name": "Convention on Biological Diversity (CBD)" },
                            { "name": "Invasive Alien Species" },
                            { "name": "Hope Spots" },
                            { "name": "IUCN Classification of Animals" },
                            { "name": "Biodiversity Liasion Group" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_3",
                "topics": [
                    {
                        "name": "Biodiversity Conservation",
                        "subtopics": [
                            { "name": "Zoological Survey of India" },
                            { "name": "Like Minded Megadiverse Countries Group" },
                            { "name": "Megadiverse Countries" },
                            { "name": "Ramsar Convention--Montreux Record" },
                            { "name": "CITES--Convention on International Trade in Endangered Species of Wild Fauna and Flora (CITES)" },
                            { "name": "International Plant Protection Convention (IPPC)" },
                            { "name": "Threats to Biodiversity" },
                            { "name": "TEEB--India Initiative" },
                            { "name": "The Great Green Wall Initiative" },
                            { "name": "PARIVESH" },
                            { "name": "Biodiversity Hotspot" },
                            { "name": "Biodiversity Heritage Site" },
                            { "name": "Cartagena Protocol on Biosafety" },
                            { "name": "Convention on Biological Diversity" },
                            { "name": "World Wide Fund Fund Nature" },
                            { "name": "Earth Overshoot Day" },
                            { "name": "\u201cWorld Charter for Nature\u201d" }
                        ]
                    },
                    {
                        "name": "Ecology and Environment--Basic Concepts",
                        "subtopics": [
                            { "name": "Biological Interaction" },
                            { "name": "Ecological Niche" },
                            { "name": "Ecosystem n its Services" },
                            { "name": "National Capital Accounting and Valuation of Ecosystem" },
                            { "name": "Ecosystem Carrying Capacity" },
                            { "name": "Allelopathy" },
                            { "name": "Wetlands Ecosystem" },
                            { "name": "Biomes of Earth--Equatorial Biome" },
                            { "name": "Responses to Environment" },
                            { "name": "Feedback Mechanism--CLAW Hypothesis" },
                            { "name": "Deep Ecology" }
                        ]
                    },
                    {
                        "name": "Biodiversity",
                        "subtopics": [
                            { "name": "Coral Reefs" },
                            { "name": "Wetlands Ecosystem" },
                            { "name": "Threats to Biodiversity" }
                        ]
                    },
                    {
                        "name": "Environment Degradation n Pollution",
                        "subtopics": [
                            { "name": "Global Conventions related to Pollution" },
                            { "name": "Desertification" },
                            { "name": "Desertification--UNCCD" },
                            { "name": "Air Pollution" },
                            { "name": "Air Pollution--Photochemical Smog" },
                            { "name": "Biomagnification" }
                        ]
                    }
                ]
            },
            {
                "name": "Module_4",
                "topics": [
                    {
                        "name": "Environment Degradation n Pollution",
                        "subtopics": [
                            { "name": "Bioremediation" },
                            { "name": "Ocean Acidification" },
                            { "name": "Eutrophication" },
                            { "name": "Types of Pollutant" },
                            { "name": "Black Carbon" }
                        ]
                    },
                    {
                        "name": "Ozone Depletion",
                        "subtopics": [
                            { "name": "Montreal Protocol" }
                        ]
                    },
                    {
                        "name": "Environment Impact Assessment",
                        "subtopics": [
                            { "name": "EIA Features" }
                        ]
                    },
                    {
                        "name": "Climate Change",
                        "subtopics": [
                            { "name": "Paris Climate Pact" },
                            { "name": "India Cooling Action Plan" },
                            { "name": "Clean Development Mechanism" },
                            { "name": "United Nations Framework Convention on Climate Change (UNFCCC" }
                        ]
                    }
                ]
            }
        ]
    }
];
export function getSubjects(): string[] {
    return hierarchicalData.map(subject => subject.name);
}
export function getModules(subject?: string): string[] {
    const subjectData = subject 
        ? hierarchicalData.find(s => s.name === subject) 
        : null;
    return subjectData 
        ? subjectData.modules.map(moduleItem => moduleItem.name) 
        : [];
}
export function getTopics(subjectName: string, moduleName: string): string[] {
    const subject = hierarchicalData.find(s => s.name === subjectName);
    const moduleData = subject?.modules.find(m => m.name === moduleName);
    return moduleData ? moduleData.topics.map(topic => topic.name) : [];
}
export function getSubtopics(subjectName: string, moduleName: string, topicName: string): string[] {
    const subject = hierarchicalData.find(s => s.name === subjectName);
    const moduleData = subject?.modules.find(m => m.name === moduleName);
    const topic = moduleData?.topics.find(t => t.name === topicName);
    return topic ? topic.subtopics.map(subtopic => subtopic.name) : [];
}
export async function getQuestions(
    subject: string, 
    moduleName: string, 
    topic: string, 
    subtopic: string
): Promise<string[]> {
    try {
        const response = await fetch(`/api/questions?subject=${subject}&module=${moduleName}&topic=${topic}&sub_topic=${subtopic}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch questions: ${response.statusText}`);
        }
        const data = await response.json();
        // Validate and extract question texts
        if (data && Array.isArray(data.data)) {
            return data.data.map((question: any) => question.Question || '');
        }
        return [];
    } catch (error) {
        console.error('Error fetching questions:', error);
        return [];
    }
}
export default hierarchicalData;
