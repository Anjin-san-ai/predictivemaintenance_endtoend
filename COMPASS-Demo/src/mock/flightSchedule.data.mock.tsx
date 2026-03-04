
export default [
  {
    tailNumber: "ZZ132",
    status: 'Un-serviceable',
    routes: [[
      {
        from: 'LHR',
        to: 'BCN',
        departureDate: '2026-02-03',
        arrivalDate: '2026-02-03',
        departureTime: '08:15',
        arrivalTime: '11:45'
      },
      {
        from: 'BCN',
        to: 'MEX',
        departureDate: '2026-02-03',
        arrivalDate: '2026-02-04',
        departureTime: '14:30',
        arrivalTime: '08:20'
      },
      {
        from: 'MEX',
        to: 'LHR',
        departureDate: '2026-02-05',
        arrivalDate: '2026-02-06',
        departureTime: '11:45',
        arrivalTime: '05:30'
      }
    ], [
      {

        from: 'LHR',
        to: 'JFK',
        departureDate: '2026-01-12',
        arrivalDate: '2026-01-12',
        departureTime: '10:30',
        arrivalTime: '18:45'
      },
      {
        from: 'JFK',
        to: 'LHR',
        departureDate: '2026-01-13',
        arrivalDate: '2026-01-14',
        departureTime: '22:15',
        arrivalTime: '09:30'
      }], [
      {
        from: 'LHR',
        to: 'CDG',
        departureDate: '2026-01-16',
        arrivalDate: '2026-01-16',
        departureTime: '14:20',
        arrivalTime: '16:40'
      },
      {
        from: 'CDG',
        to: 'SIN',
        departureDate: '2026-01-16',
        arrivalDate: '2026-01-17',
        departureTime: '18:30',
        arrivalTime: '12:15'
      },
      {
        from: 'SIN',
        to: 'LHR',
        departureDate: '2026-01-18',
        arrivalDate: '2026-01-19',
        departureTime: '01:45',
        arrivalTime: '07:20'
      }],
    [{
      from: 'LHR',
      to: 'FRA',
      departureDate: '2026-02-08',
      arrivalDate: '2026-02-08',
      departureTime: '07:30',
      arrivalTime: '10:15'
    },
    {
      from: 'FRA',
      to: 'JFK',
      departureDate: '2026-02-08',
      arrivalDate: '2026-02-08',
      departureTime: '13:45',
      arrivalTime: '16:20'
    },
    {
      from: 'JFK',
      to: 'LHR',
      departureDate: '2026-02-10',
      arrivalDate: '2026-02-11',
      departureTime: '19:30',
      arrivalTime: '06:45'
    }],
    [{
      from: 'LHR',
      to: 'LAX',
      departureDate: '2026-02-15',
      arrivalDate: '2026-02-15',
      departureTime: '11:00',
      arrivalTime: '14:30'
    },
    {
      from: 'LAX',
      to: 'LHR',
      departureDate: '2026-02-16',
      arrivalDate: '2026-02-17',
      departureTime: '16:45',
      arrivalTime: '10:15'
    }],
    [{
      from: 'LHR',
      to: 'DXB',
      departureDate: '2026-02-21',
      arrivalDate: '2026-02-22',
      departureTime: '15:30',
      arrivalTime: '00:45'
    },
    {
      from: 'DXB',
      to: 'LHR',
      departureDate: '2026-02-23',
      arrivalDate: '2026-02-23',
      departureTime: '03:15',
      arrivalTime: '07:50'
    }],
    [{
      from: 'LHR',
      to: 'DXB',
      departureDate: '2026-01-31',
      arrivalDate: '2026-02-01',
      departureTime: '04:30',
      arrivalTime: '00:45'
    },
    {
      from: 'DXB',
      to: 'LHR',
      departureDate: '2026-02-01',
      arrivalDate: '2026-02-02',
      departureTime: '03:15',
      arrivalTime: '17:50'
    }]
    ],
    maintenance: [
      {
        id: '13201',
        type: 'Planned',
        scheduleStartDate: '2026-02-06',
        scheduleEndDate: '2026-02-07',
        scheduleStartTime: '06:00',
        scheduleEndTime: '18:00'
      },
      {
        id: '13202',
        type: 'In-Depth',
        scheduleStartDate: '2026-02-15',
        scheduleEndDate: '2026-02-20',
        scheduleStartTime: '06:00',
        scheduleEndTime: '18:00'
      },
      {
        id: '13203',
        type: 'Planned',
        scheduleStartDate: '2026-02-23',
        scheduleEndDate: '2026-02-24',
        scheduleStartTime: '08:00',
        scheduleEndTime: '17:00'
      }
    ]
  },
  {
    tailNumber: "ZZ153",
    status: 'In flight',
    routes: [
      [
        {
          from: 'LHR',
          to: 'FRA',
          departureDate: '2026-01-14',
          arrivalDate: '2026-01-14',
          departureTime: '07:45',
          arrivalTime: '10:15'
        },
        {
          from: 'FRA',
          to: 'NRT',
          departureDate: '2026-01-14',
          arrivalDate: '2026-01-15',
          departureTime: '13:20',
          arrivalTime: '08:40'
        },
        {
          from: 'NRT',
          to: 'LHR',
          departureDate: '2026-01-16',
          arrivalDate: '2026-01-16',
          departureTime: '11:30',
          arrivalTime: '15:45'
        }
      ],
      [{
        from: 'LHR',
        to: 'DXB',
        departureDate: '2026-02-05',
        arrivalDate: '2026-02-06',
        departureTime: '00:30',
        arrivalTime: '13:45'
      },
      {
        from: 'DXB',
        to: 'LHR',
        departureDate: '2026-02-06',
        arrivalDate: '2026-02-08',
        departureTime: '15:15',
        arrivalTime: '06:55'
      }],
      [
        {
          from: 'LHR',
          to: 'MAD',
          departureDate: '2026-02-09',
          arrivalDate: '2026-02-09',
          departureTime: '08:15',
          arrivalTime: '11:30'
        },
        {
          from: 'MAD',
          to: 'LAX',
          departureDate: '2026-02-09',
          arrivalDate: '2026-02-10',
          departureTime: '14:45',
          arrivalTime: '08:20'
        },
        {
          from: 'LAX',
          to: 'LHR',
          departureDate: '2026-02-11',
          arrivalDate: '2026-02-12',
          departureTime: '20:30',
          arrivalTime: '14:15'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'SYD',
          departureDate: '2026-02-25',
          arrivalDate: '2026-02-26',
          departureTime: '21:30',
          arrivalTime: '05:45'
        },
        {
          from: 'SYD',
          to: 'LHR',
          departureDate: '2026-02-28',
          arrivalDate: '2026-02-29',
          departureTime: '14:15',
          arrivalTime: '05:30'
        }
      ]
    ],
    maintenance: [
      {
        id: '15301',
        type: 'Planned',
        scheduleStartDate: '2026-01-12',
        scheduleEndDate: '2026-01-13',
        scheduleStartTime: '02:00',
        scheduleEndTime: '21:00'
      },
      {
        id: '15302',
        type: 'Planned',
        scheduleStartDate: '2026-02-16',
        scheduleEndDate: '2026-02-17',
        scheduleStartTime: '09:00',
        scheduleEndTime: '19:00'
      },
      {
        id: '15303',
        type: 'Planned',
        scheduleStartDate: '2026-02-13',
        scheduleEndDate: '2026-02-14',
        scheduleStartTime: '04:00',
        scheduleEndTime: '21:00'
      }
    ]
  },

  {
    tailNumber: "ZZ165",
    status: 'Un-serviceable',
    routes: [
      [
        {
          from: 'LHR',
          to: 'ARN',
          departureDate: '2026-01-17',
          arrivalDate: '2026-01-17',
          departureTime: '08:30',
          arrivalTime: '11:45'
        },
        {
          from: 'ARN',
          to: 'KUL',
          departureDate: '2026-01-17',
          arrivalDate: '2026-01-18',
          departureTime: '14:20',
          arrivalTime: '06:15'
        },
        {
          from: 'KUL',
          to: 'LHR',
          departureDate: '2026-01-19',
          arrivalDate: '2026-01-19',
          departureTime: '09:45',
          arrivalTime: '15:30'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'BER',
          departureDate: '2026-02-06',
          arrivalDate: '2026-02-06',
          departureTime: '07:45',
          arrivalTime: '10:30'
        },
        {
          from: 'BER',
          to: 'SIN',
          departureDate: '2026-02-07',
          arrivalDate: '2026-02-08',
          departureTime: '13:20',
          arrivalTime: '06:45'
        },
        {
          from: 'SIN',
          to: 'LHR',
          departureDate: '2026-02-08',
          arrivalDate: '2026-02-09',
          departureTime: '14:30',
          arrivalTime: '06:15'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'GIG',
          departureDate: '2026-02-10',
          arrivalDate: '2026-02-11',
          departureTime: '07:15',
          arrivalTime: '16:45'
        },
        {
          from: 'GIG',
          to: 'LHR',
          departureDate: '2026-02-11',
          arrivalDate: '2026-02-12',
          departureTime: '19:30',
          arrivalTime: '21:20'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'SEA',
          departureDate: '2026-03-05',
          arrivalDate: '2026-03-05',
          departureTime: '14:15',
          arrivalTime: '16:45'
        },
        {
          from: 'SEA',
          to: 'LHR',
          departureDate: '2026-03-07',
          arrivalDate: '2026-03-08',
          departureTime: '19:30',
          arrivalTime: '13:20'
        }
      ]
    ],
    maintenance: [
      {
        id: '16501',
        type: 'Planned',
        scheduleStartDate: '2026-02-13',
        scheduleEndDate: '2026-02-15',
        scheduleStartTime: '08:00',
        scheduleEndTime: '17:00'
      },
      {
        id: '16502',
        type: 'Planned',
        scheduleStartDate: '2026-02-28',
        scheduleEndDate: '2026-03-01',
        scheduleStartTime: '04:00',
        scheduleEndTime: '17:00'
      }
    ]
  },
  {
    tailNumber: "ZZ190",
    status: 'In flight',
    routes: [
      [
        {
          from: 'LHR',
          to: 'LIS',
          departureDate: '2026-01-19',
          arrivalDate: '2026-01-19',
          departureTime: '11:40',
          arrivalTime: '14:20'
        },
        {
          from: 'LIS',
          to: 'GIG',
          departureDate: '2026-01-19',
          arrivalDate: '2026-01-20',
          departureTime: '17:30',
          arrivalTime: '01:45'
        },
        {
          from: 'GIG',
          to: 'LHR',
          departureDate: '2026-01-21',
          arrivalDate: '2026-01-22',
          departureTime: '05:15',
          arrivalTime: '20:30'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'IAD',
          departureDate: '2026-02-07',
          arrivalDate: '2026-02-07',
          departureTime: '11:20',
          arrivalTime: '14:45'
        },
        {
          from: 'IAD',
          to: 'LHR',
          departureDate: '2026-02-08',
          arrivalDate: '2026-02-10',
          departureTime: '17:30',
          arrivalTime: '05:55'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'VIE',
          departureDate: '2026-02-11',
          arrivalDate: '2026-02-12',
          departureTime: '08:15',
          arrivalTime: '11:45'
        },
        {
          from: 'VIE',
          to: 'BKK',
          departureDate: '2026-02-12',
          arrivalDate: '2026-02-12',
          departureTime: '14:30',
          arrivalTime: '04:15'
        },
        {
          from: 'BKK',
          to: 'LHR',
          departureDate: '2026-02-13',
          arrivalDate: '2026-02-13',
          departureTime: '10:45',
          arrivalTime: '16:30'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'ATL',
          departureDate: '2026-02-18',
          arrivalDate: '2026-02-18',
          departureTime: '16:50',
          arrivalTime: '20:15'
        },
        {
          from: 'ATL',
          to: 'LHR',
          departureDate: '2026-02-20',
          arrivalDate: '2026-02-21',
          departureTime: '22:40',
          arrivalTime: '11:30'
        }
      ]
    ],
    maintenance: [
      {
        id: '19001',
        type: 'Planned',
        scheduleStartDate: '2026-02-14',
        scheduleEndDate: '2026-02-16',
        scheduleStartTime: '07:00',
        scheduleEndTime: '15:00'
      },
      {
        id: '19002',
        type: 'Planned',
        scheduleStartDate: '2026-03-05',
        scheduleEndDate: '2026-03-07',
        scheduleStartTime: '07:00',
        scheduleEndTime: '23:00'
      }
    ]
  },
  {
    tailNumber: "ZZ175",
    status: 'In maintenance',
    routes: [
      [
        {
          from: 'LHR',
          to: 'CPH',
          departureDate: '2026-01-03',
          arrivalDate: '2026-01-03',
          departureTime: '00:00',
          arrivalTime: '18:10'
        },
        {
          from: 'CPH',
          to: 'LHR',
          departureDate: '2026-01-03',
          arrivalDate: '2026-01-04',
          departureTime: '19:45',
          arrivalTime: '18:15'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'WAW',
          departureDate: '2026-02-04',
          arrivalDate: '2026-02-04',
          departureTime: '14:15',
          arrivalTime: '17:30'
        },
        {
          from: 'WAW',
          to: 'PVG',
          departureDate: '2026-02-04',
          arrivalDate: '2026-02-05',
          departureTime: '20:45',
          arrivalTime: '12:20'
        },
        {
          from: 'PVG',
          to: 'LHR',
          departureDate: '2026-02-06',
          arrivalDate: '2026-02-06',
          departureTime: '16:30',
          arrivalTime: '19:45'
        }
      ],
      [{
        from: 'LHR',
        to: 'CPH',
        departureDate: '2026-02-08',
        arrivalDate: '2026-02-08',
        departureTime: '09:20',
        arrivalTime: '17:35'
      },
      {
        from: 'CPH',
        to: 'TPE',
        departureDate: '2026-02-09',
        arrivalDate: '2026-02-09',
        departureTime: '20:45',
        arrivalTime: '14:20'
      },
      {
        from: 'TPE',
        to: 'LHR',
        departureDate: '2026-02-09',
        arrivalDate: '2026-02-11',
        departureTime: '18:15',
        arrivalTime: '05:45'
      }],
      [
        {
          from: 'LHR',
          to: 'ZUR',
          departureDate: '2026-02-12',
          arrivalDate: '2026-02-12',
          departureTime: '09:30',
          arrivalTime: '12:15'
        },
        {
          from: 'ZUR',
          to: 'NRT',
          departureDate: '2026-02-13',
          arrivalDate: '2026-02-13',
          departureTime: '15:45',
          arrivalTime: '10:30'
        },
        {
          from: 'NRT',
          to: 'LHR',
          departureDate: '2026-02-14',
          arrivalDate: '2026-02-14',
          departureTime: '13:20',
          arrivalTime: '20:45'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'PHX',
          departureDate: '2026-02-12',
          arrivalDate: '2026-02-12',
          departureTime: '12:30',
          arrivalTime: '15:45'
        },
        {
          from: 'PHX',
          to: 'LHR',
          departureDate: '2026-02-14',
          arrivalDate: '2026-02-15',
          departureTime: '17:20',
          arrivalTime: '11:10'
        }
      ]
    ],
    maintenance: [
      {
        id: '17501',
        type: 'Planned',
        scheduleStartDate: '2026-01-05',
        scheduleEndDate: '2026-02-04',
        scheduleStartTime: '03:00',
        scheduleEndTime: '12:00'
      },
      {
        id: '17502',
        type: 'Planned',
        scheduleStartDate: '2026-02-15',
        scheduleEndDate: '2026-02-17',
        scheduleStartTime: '13:00',
        scheduleEndTime: '18:00'
      }
    ]
  },
  {
    tailNumber: "ZZ145",
    status: 'Depth maintenance',
    routes: [
      [
        {
          from: 'LHR',
          to: 'PRG',
          departureDate: '2026-02-03',
          arrivalDate: '2026-02-03',
          departureTime: '09:45',
          arrivalTime: '12:30'
        },
        {
          from: 'PRG',
          to: 'SIN',
          departureDate: '2026-02-03',
          arrivalDate: '2026-02-04',
          departureTime: '15:20',
          arrivalTime: '08:45'
        },
        {
          from: 'SIN',
          to: 'LHR',
          departureDate: '2026-02-05',
          arrivalDate: '2026-02-05',
          departureTime: '12:30',
          arrivalTime: '18:15'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'OSL',
          departureDate: '2026-01-23',
          arrivalDate: '2026-01-23',
          departureTime: '07:15',
          arrivalTime: '10:30'
        },
        {
          from: 'OSL',
          to: 'CGK',
          departureDate: '2026-01-23',
          arrivalDate: '2026-01-24',
          departureTime: '13:45',
          arrivalTime: '05:30'
        },
        {
          from: 'CGK',
          to: 'LHR',
          departureDate: '2026-01-25',
          arrivalDate: '2026-01-25',
          departureTime: '08:20',
          arrivalTime: '14:45'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'AMS',
          departureDate: '2026-02-08',
          arrivalDate: '2026-02-08',
          departureTime: '06:45',
          arrivalTime: '08:30'
        },
        {
          from: 'AMS',
          to: 'HKG',
          departureDate: '2026-02-08',
          arrivalDate: '2026-02-09',
          departureTime: '11:20',
          arrivalTime: '05:45'
        },
        {
          from: 'HKG',
          to: 'LHR',
          departureDate: '2026-02-11',
          arrivalDate: '2026-02-12',
          departureTime: '11:30',
          arrivalTime: '06:25'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'ORD',
          departureDate: '2026-02-13',
          arrivalDate: '2026-02-13',
          departureTime: '14:00',
          arrivalTime: '18:00'
        },
        {
          from: 'ORD',
          to: 'LHR',
          departureDate: '2026-02-14',
          arrivalDate: '2026-02-15',
          departureTime: '20:00',
          arrivalTime: '21:00'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'BOS',
          departureDate: '2026-02-06',
          arrivalDate: '2026-02-06',
          departureTime: '09:40',
          arrivalTime: '12:25'
        },
        {
          from: 'BOS',
          to: 'LHR',
          departureDate: '2026-02-08',
          arrivalDate: '2026-02-08',
          departureTime: '15:15',
          arrivalTime: '02:30'
        }
      ]
    ],
    maintenance: [
      {
        id: '14501',
        type: 'Planned',
        scheduleStartDate: '2026-02-16',
        scheduleEndDate: '2026-02-19',
        scheduleStartTime: '13:00',
        scheduleEndTime: '03:00'
      },
      {
        id: '14502',
        type: 'Planned',
        scheduleStartDate: '2026-02-20',
        scheduleEndDate: '2026-02-23',
        scheduleStartTime: '05:00',
        scheduleEndTime: '21:00'
      }
    ]
  },
  {
    tailNumber: "ZZ198",
    status: 'Serviceable',
    routes: [
      [{
        from: 'LHR',
        to: 'JFK',
        departureDate: '2026-01-15',
        arrivalDate: '2026-01-15',
        departureTime: '09:00',
        arrivalTime: '17:30'
      },
      {
        from: 'JFK',
        to: 'LHR',
        departureDate: '2026-01-16',
        arrivalDate: '2026-01-17',
        departureTime: '22:00',
        arrivalTime: '09:15'
      }],
      [{
        from: 'LHR',
        to: 'CDG',
        departureDate: '2026-01-25',
        arrivalDate: '2026-01-25',
        departureTime: '14:20',
        arrivalTime: '16:50'
      },
      {
        from: 'CDG',
        to: 'LHR',
        departureDate: '2026-01-25',
        arrivalDate: '2026-01-27',
        departureTime: '18:30',
        arrivalTime: '19:00'
      }],
      [{
        from: 'LHR',
        to: 'DXB',
        departureDate: '2026-02-12',
        arrivalDate: '2026-02-13',
        departureTime: '23:45',
        arrivalTime: '08:30'
      },
      {
        from: 'DXB',
        to: 'SIN',
        departureDate: '2026-02-13',
        arrivalDate: '2026-02-14',
        departureTime: '14:15',
        arrivalTime: '23:45'
      },
      {
        from: 'SIN',
        to: 'LHR',
        departureDate: '2026-02-14',
        arrivalDate: '2026-02-15',
        departureTime: '02:30',
        arrivalTime: '08:45'
      }],
      [{
        from: 'LHR',
        to: 'LAX',
        departureDate: '2026-02-16',
        arrivalDate: '2026-02-16',
        departureTime: '11:30',
        arrivalTime: '14:45'
      },
      {
        from: 'LAX',
        to: 'LHR',
        departureDate: '2026-02-17',
        arrivalDate: '2026-02-18',
        departureTime: '16:20',
        arrivalTime: '11:30'
      }]
    ],
    maintenance: [
      {
        id: '20001',
        type: 'Planned',
        scheduleStartDate: '2026-01-05',
        scheduleEndDate: '2026-01-07',
        scheduleStartTime: '08:00',
        scheduleEndTime: '18:00'
      },
      {
        id: '20002',
        type: 'Planned',
        scheduleStartDate: '2026-01-20',
        scheduleEndDate: '2026-01-22',
        scheduleStartTime: '06:00',
        scheduleEndTime: '16:00'
      },
      {
        id: '20003',
        type: 'Planned',
        scheduleStartDate: '2026-02-20',
        scheduleEndDate: '2026-02-21',
        scheduleStartTime: '07:00',
        scheduleEndTime: '17:00'
      },
      {
        id: '20004',
        type: 'In-Depth',
        scheduleStartDate: '2026-02-01',
        scheduleEndDate: '2026-02-15',
        scheduleStartTime: '06:00',
        scheduleEndTime: '18:00'
      }
    ]
  },
  {
    tailNumber: "ZZ199",
    status: 'Serviceable',
    routes: [
      // All routes and maintenance are non-overlapping
      // Each flight schedule is at least 2 days, some with multi-stop legs
      [
        {
          from: 'LHR',
          to: 'BRU',
          departureDate: '2026-01-07',
          arrivalDate: '2026-01-07',
          departureTime: '07:00',
          arrivalTime: '08:15'
        },
        {
          from: 'BRU',
          to: 'FRA',
          departureDate: '2026-01-08',
          arrivalDate: '2026-01-08',
          departureTime: '09:00',
          arrivalTime: '10:30'
        },
        {
          from: 'FRA',
          to: 'LHR',
          departureDate: '2026-01-09',
          arrivalDate: '2026-01-09',
          departureTime: '19:00',
          arrivalTime: '20:15'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'ZRH',
          departureDate: '2026-01-11',
          arrivalDate: '2026-01-11',
          departureTime: '10:00',
          arrivalTime: '12:00'
        },
        {
          from: 'ZRH',
          to: 'LHR',
          departureDate: '2026-01-13',
          arrivalDate: '2026-01-13',
          departureTime: '15:00',
          arrivalTime: '16:45'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'DUB',
          departureDate: '2026-01-16',
          arrivalDate: '2026-01-16',
          departureTime: '08:00',
          arrivalTime: '09:15'
        },
        {
          from: 'DUB',
          to: 'AMS',
          departureDate: '2026-01-17',
          arrivalDate: '2026-01-17',
          departureTime: '17:00',
          arrivalTime: '18:30'
        },
        {
          from: 'AMS',
          to: 'LHR',
          departureDate: '2026-01-18',
          arrivalDate: '2026-01-18',
          departureTime: '20:00',
          arrivalTime: '23:00'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'MAD',
          departureDate: '2026-01-20',
          arrivalDate: '2026-01-20',
          departureTime: '12:00',
          arrivalTime: '15:00'
        },
        {
          from: 'MAD',
          to: 'LHR',
          departureDate: '2026-01-22',
          arrivalDate: '2026-01-22',
          departureTime: '16:00',
          arrivalTime: '18:30'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'FCO',
          departureDate: '2026-01-25',
          arrivalDate: '2026-01-25',
          departureTime: '03:00',
          arrivalTime: '12:00'
        },
        {
          from: 'FCO',
          to: 'IST',
          departureDate: '2026-01-26',
          arrivalDate: '2026-01-26',
          departureTime: '17:00',
          arrivalTime: '20:00'
        },
        {
          from: 'IST',
          to: 'LHR',
          departureDate: '2026-01-27',
          arrivalDate: '2026-01-27',
          departureTime: '21:00',
          arrivalTime: '23:00'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'ORD',
          departureDate: '2026-02-06',
          arrivalDate: '2026-02-06',
          departureTime: '01:00',
          arrivalTime: '18:00'
        },
        {
          from: 'ORD',
          to: 'LHR',
          departureDate: '2026-02-08',
          arrivalDate: '2026-02-08',
          departureTime: '20:00',
          arrivalTime: '03:00'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'FRA',
          departureDate: '2026-02-11',
          arrivalDate: '2026-02-11',
          departureTime: '01:30',
          arrivalTime: '15:00'
        },
        {
          from: 'FRA',
          to: 'HND',
          departureDate: '2026-02-12',
          arrivalDate: '2026-02-12',
          departureTime: '17:00',
          arrivalTime: '18:30'
        },
        {
          from: 'HND',
          to: 'LHR',
          departureDate: '2026-02-13',
          arrivalDate: '2026-02-13',
          departureTime: '09:00',
          arrivalTime: '15:00'
        }
      ]
    ],
    maintenance: [
      {
        id: '21001',
        type: 'Planned',
        scheduleStartDate: '2026-02-08',
        scheduleEndDate: '2026-02-09',
        scheduleStartTime: '08:00',
        scheduleEndTime: '18:00'
      },
      {
        id: '21003',
        type: 'In-Depth',
        scheduleStartDate: '2026-02-01',
        scheduleEndDate: '2026-02-10',
        scheduleStartTime: '06:00',
        scheduleEndTime: '18:00'
      }
    ]
  },
  {
    tailNumber: "ZZ210",
    status: 'Depth maintenance',
    routes: [
      [
        {
          from: 'LHR',
          to: 'MUC',
          departureDate: '2026-01-15',
          arrivalDate: '2026-01-15',
          departureTime: '11:20',
          arrivalTime: '14:05'
        },
        {
          from: 'MUC',
          to: 'BKK',
          departureDate: '2026-01-15',
          arrivalDate: '2026-01-16',
          departureTime: '16:45',
          arrivalTime: '08:30'
        },
        {
          from: 'BKK',
          to: 'LHR',
          departureDate: '2026-01-17',
          arrivalDate: '2026-01-17',
          departureTime: '12:15',
          arrivalTime: '18:45'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'MEL',
          departureDate: '2026-02-15',
          arrivalDate: '2026-02-16',
          departureTime: '22:00',
          arrivalTime: '07:30'
        },
        {
          from: 'MEL',
          to: 'LHR',
          departureDate: '2026-02-18',
          arrivalDate: '2026-02-19',
          departureTime: '11:45',
          arrivalTime: '05:20'
        }
      ]
    ],
    maintenance: [
      {
        id: '21001',
        type: 'In-Depth',
        scheduleStartDate: '2026-02-08',
        scheduleEndDate: '2026-02-12',
        scheduleStartTime: '06:00',
        scheduleEndTime: '18:00'
      },
      {
        id: '21002',
        type: 'Planned',
        scheduleStartDate: '2026-02-13',
        scheduleEndDate: '2026-02-15',
        scheduleStartTime: '08:00',
        scheduleEndTime: '16:00'
      }
    ]
  },
  {
    tailNumber: "ZZ134",
    status: 'Depth maintenance',
    routes: [
      [
        {
          from: 'LHR',
          to: 'MAD',
          departureDate: '2026-01-16',
          arrivalDate: '2026-01-16',
          departureTime: '09:15',
          arrivalTime: '12:30'
        },
        {
          from: 'MAD',
          to: 'GRU',
          departureDate: '2026-01-16',
          arrivalDate: '2026-01-17',
          departureTime: '15:45',
          arrivalTime: '22:20'
        },
        {
          from: 'GRU',
          to: 'LHR',
          departureDate: '2026-01-19',
          arrivalDate: '2026-01-20',
          departureTime: '01:30',
          arrivalTime: '17:45'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'FCO',
          departureDate: '2026-02-01',
          arrivalDate: '2026-02-01',
          departureTime: '07:15',
          arrivalTime: '10:30'
        },
        {
          from: 'FCO',
          to: 'PEK',
          departureDate: '2026-02-01',
          arrivalDate: '2026-02-02',
          departureTime: '13:45',
          arrivalTime: '05:20'
        },
        {
          from: 'PEK',
          to: 'LHR',
          departureDate: '2026-02-03',
          arrivalDate: '2026-02-03',
          departureTime: '11:30',
          arrivalTime: '14:45'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'DEN',
          departureDate: '2026-02-22',
          arrivalDate: '2026-02-22',
          departureTime: '14:30',
          arrivalTime: '17:15'
        },
        {
          from: 'DEN',
          to: 'LHR',
          departureDate: '2026-02-24',
          arrivalDate: '2026-02-25',
          departureTime: '20:45',
          arrivalTime: '12:30'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'CPT',
          departureDate: '2026-02-20',
          arrivalDate: '2026-02-21',
          departureTime: '20:15',
          arrivalTime: '08:45'
        },
        {
          from: 'CPT',
          to: 'LHR',
          departureDate: '2026-02-23',
          arrivalDate: '2026-02-24',
          departureTime: '12:30',
          arrivalTime: '05:15'
        }
      ]
    ],
    maintenance: [
      {
        id: '13401',
        type: 'Planned',
        scheduleStartDate: '2026-02-09',
        scheduleEndDate: '2026-02-10',
        scheduleStartTime: '04:00',
        scheduleEndTime: '23:00'
      },
      {
        id: '13402',
        type: 'Planned',
        scheduleStartDate: '2026-03-07',
        scheduleEndDate: '2026-03-09',
        scheduleStartTime: '07:00',
        scheduleEndTime: '23:00'
      },
      {
        id: '13403',
        type: 'Planned',
        scheduleStartDate: '2026-02-15',
        scheduleEndDate: '2026-02-16',
        scheduleStartTime: '04:00',
        scheduleEndTime: '16:00'
      }
    ]
  },
  {
    tailNumber: "ZZ220",
    status: 'Un-serviceable',
    routes: [
      [
        {
          from: 'LHR',
          to: 'BCN',
          departureDate: '2026-01-18',
          arrivalDate: '2026-01-18',
          departureTime: '08:45',
          arrivalTime: '11:15'
        },
        {
          from: 'BCN',
          to: 'EZE',
          departureDate: '2026-01-18',
          arrivalDate: '2026-01-19',
          departureTime: '14:30',
          arrivalTime: '04:45'
        },
        {
          from: 'EZE',
          to: 'LHR',
          departureDate: '2026-01-21',
          arrivalDate: '2026-01-22',
          departureTime: '08:15',
          arrivalTime: '03:30'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'BOM',
          departureDate: '2026-02-12',
          arrivalDate: '2026-02-13',
          departureTime: '01:45',
          arrivalTime: '15:20'
        },
        {
          from: 'BOM',
          to: 'LHR',
          departureDate: '2026-02-15',
          arrivalDate: '2026-02-15',
          departureTime: '19:30',
          arrivalTime: '23:45'
        }
      ]
    ],
    maintenance: [
      {
        id: '22001',
        type: 'Planned',
        scheduleStartDate: '2026-02-08',
        scheduleEndDate: '2026-02-11',
        scheduleStartTime: '06:00',
        scheduleEndTime: '18:00'
      },
      {
        id: '22002',
        type: 'Planned',
        scheduleStartDate: '2026-02-25',
        scheduleEndDate: '2026-02-26',
        scheduleStartTime: '04:00',
        scheduleEndTime: '16:00'
      }
    ]
  },
  {
    tailNumber: "ZZ240",
    status: 'In maintenance',
    routes: [
      [
        {
          from: 'LHR',
          to: 'VIE',
          departureDate: '2026-01-12',
          arrivalDate: '2026-01-12',
          departureTime: '13:20',
          arrivalTime: '16:35'
        },
        {
          from: 'VIE',
          to: 'TPE',
          departureDate: '2026-01-12',
          arrivalDate: '2026-01-13',
          departureTime: '19:15',
          arrivalTime: '12:40'
        },
        {
          from: 'TPE',
          to: 'LHR',
          departureDate: '2026-01-14',
          arrivalDate: '2026-01-14',
          departureTime: '16:30',
          arrivalTime: '21:15'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'ARN',
          departureDate: '2026-02-03',
          arrivalDate: '2026-02-03',
          departureTime: '12:30',
          arrivalTime: '15:45'
        },
        {
          from: 'ARN',
          to: 'SYD',
          departureDate: '2026-02-03',
          arrivalDate: '2026-02-04',
          departureTime: '18:20',
          arrivalTime: '15:35'
        },
        {
          from: 'SYD',
          to: 'LHR',
          departureDate: '2026-02-05',
          arrivalDate: '2026-02-05',
          departureTime: '21:45',
          arrivalTime: '11:20'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'MIA',
          departureDate: '2026-02-20',
          arrivalDate: '2026-02-20',
          departureTime: '10:45',
          arrivalTime: '15:30'
        },
        {
          from: 'MIA',
          to: 'LHR',
          departureDate: '2026-02-22',
          arrivalDate: '2026-02-23',
          departureTime: '18:20',
          arrivalTime: '07:45'
        }
      ]
    ],
    maintenance: [
      {
        id: '24001',
        type: 'Planned',
        scheduleStartDate: '2026-02-11',
        scheduleEndDate: '2026-02-12',
        scheduleStartTime: '04:00',
        scheduleEndTime: '22:00'
      }
    ]
  },
  {
    tailNumber: "ZZ230",
    status: 'Depth maintenance',
    routes: [
      [
        {
          from: 'LHR',
          to: 'BUD',
          departureDate: '2026-02-04',
          arrivalDate: '2026-02-04',
          departureTime: '11:30',
          arrivalTime: '14:15'
        },
        {
          from: 'BUD',
          to: 'BKK',
          departureDate: '2026-02-04',
          arrivalDate: '2026-02-05',
          departureTime: '17:45',
          arrivalTime: '09:30'
        },
        {
          from: 'BKK',
          to: 'LHR',
          departureDate: '2026-02-05',
          arrivalDate: '2026-02-06',
          departureTime: '13:20',
          arrivalTime: '19:45'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'HEL',
          departureDate: '2026-01-25',
          arrivalDate: '2026-01-25',
          departureTime: '12:45',
          arrivalTime: '16:20'
        },
        {
          from: 'HEL',
          to: 'BKK',
          departureDate: '2026-01-25',
          arrivalDate: '2026-01-26',
          departureTime: '19:10',
          arrivalTime: '09:45'
        },
        {
          from: 'BKK',
          to: 'LHR',
          departureDate: '2026-01-27',
          arrivalDate: '2026-01-27',
          departureTime: '13:30',
          arrivalTime: '19:15'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'MUC',
          departureDate: '2026-02-10',
          arrivalDate: '2026-02-10',
          departureTime: '10:15',
          arrivalTime: '13:00'
        },
        {
          from: 'MUC',
          to: 'PVG',
          departureDate: '2026-02-10',
          arrivalDate: '2026-02-11',
          departureTime: '16:30',
          arrivalTime: '09:15'
        },
        {
          from: 'PVG',
          to: 'LHR',
          departureDate: '2026-02-13',
          arrivalDate: '2026-02-13',
          departureTime: '12:45',
          arrivalTime: '17:20'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'IAD',
          departureDate: '2026-03-02',
          arrivalDate: '2026-03-02',
          departureTime: '11:20',
          arrivalTime: '14:45'
        },
        {
          from: 'IAD',
          to: 'LHR',
          departureDate: '2026-03-04',
          arrivalDate: '2026-03-05',
          departureTime: '17:30',
          arrivalTime: '05:15'
        }
      ]
    ],
    maintenance: [
      {
        id: '23001',
        type: 'Planned',
        scheduleStartDate: '2026-02-02',
        scheduleEndDate: '2026-02-04',
        scheduleStartTime: '06:00',
        scheduleEndTime: '05:00'
      },
      {
        id: '23002',
        type: 'Planned',
        scheduleStartDate: '2026-02-20',
        scheduleEndDate: '2026-02-21',
        scheduleStartTime: '04:00',
        scheduleEndTime: '17:00'
      }

    ]
  },
  {
    tailNumber: "ZZ250",
    status: 'In maintenance',
    routes: [
      [
        {
          from: 'LHR',
          to: 'ZUR',
          departureDate: '2026-02-04',
          arrivalDate: '2026-02-04',
          departureTime: '12:45',
          arrivalTime: '15:30'
        },
        {
          from: 'ZUR',
          to: 'NRT',
          departureDate: '2026-02-04',
          arrivalDate: '2026-02-05',
          departureTime: '18:15',
          arrivalTime: '13:45'
        },
        {
          from: 'NRT',
          to: 'LHR',
          departureDate: '2026-02-05',
          arrivalDate: '2026-02-06',
          departureTime: '17:30',
          arrivalTime: '20:15'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'PRG',
          departureDate: '2026-01-14',
          arrivalDate: '2026-01-14',
          departureTime: '16:20',
          arrivalTime: '19:15'
        },
        {
          from: 'PRG',
          to: 'SYD',
          departureDate: '2026-01-14',
          arrivalDate: '2026-01-15',
          departureTime: '22:30',
          arrivalTime: '19:45'
        },
        {
          from: 'SYD',
          to: 'LHR',
          departureDate: '2026-01-17',
          arrivalDate: '2026-01-17',
          departureTime: '23:20',
          arrivalTime: '05:30'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'LAX',
          departureDate: '2026-02-01',
          arrivalDate: '2026-02-01',
          departureTime: '15:45',
          arrivalTime: '18:20'
        },
        {
          from: 'LAX',
          to: 'LHR',
          departureDate: '2026-02-03',
          arrivalDate: '2026-02-04',
          departureTime: '21:10',
          arrivalTime: '15:45'
        }
      ]
    ],
    maintenance: [
      {
        id: '25001',
        type: 'In-Depth',
        scheduleStartDate: '2026-02-01',
        scheduleEndDate: '2026-02-18',
        scheduleStartTime: '06:00',
        scheduleEndTime: '18:00'
      },
      {
        id: '25002',
        type: 'Planned',
        scheduleStartDate: '2026-03-05',
        scheduleEndDate: '2026-03-07',
        scheduleStartTime: '07:00',
        scheduleEndTime: '23:00'
      }
    ]
  },
  {
    tailNumber: "ZZ156",
    status: 'In flight',
    routes: [
      [
        {
          from: 'LHR',
          to: 'MUC',
          departureDate: '2026-01-04',
          arrivalDate: '2026-01-04',
          departureTime: '15:30',
          arrivalTime: '18:15'
        },
        {
          from: 'MUC',
          to: 'PVG',
          departureDate: '2026-01-04',
          arrivalDate: '2026-01-05',
          departureTime: '21:45',
          arrivalTime: '14:30'
        },
        {
          from: 'PVG',
          to: 'LHR',
          departureDate: '2026-01-05',
          arrivalDate: '2026-01-06',
          departureTime: '18:45',
          arrivalTime: '22:20'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'AMS',
          departureDate: '2026-01-11',
          arrivalDate: '2026-01-11',
          departureTime: '12:15',
          arrivalTime: '14:30'
        },
        {
          from: 'AMS',
          to: 'ICN',
          departureDate: '2026-01-11',
          arrivalDate: '2026-01-12',
          departureTime: '17:45',
          arrivalTime: '11:20'
        },
        {
          from: 'ICN',
          to: 'LHR',
          departureDate: '2026-01-13',
          arrivalDate: '2026-01-13',
          departureTime: '15:30',
          arrivalTime: '18:45'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'BRU',
          departureDate: '2026-02-02',
          arrivalDate: '2026-02-03',
          departureTime: '00:30',
          arrivalTime: '10:45'
        },
        {
          from: 'BRU',
          to: 'DXB',
          departureDate: '2026-02-03',
          arrivalDate: '2026-02-03',
          departureTime: '13:20',
          arrivalTime: '21:45'
        },
        {
          from: 'DXB',
          to: 'LHR',
          departureDate: '2026-02-05',
          arrivalDate: '2026-02-04',
          departureTime: '08:15',
          arrivalTime: '11:30'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'CDG',
          departureDate: '2026-02-10',
          arrivalDate: '2026-02-10',
          departureTime: '09:30',
          arrivalTime: '11:45'
        },
        {
          from: 'CDG',
          to: 'NRT',
          departureDate: '2026-02-10',
          arrivalDate: '2026-02-11',
          departureTime: '15:20',
          arrivalTime: '10:35'
        },
        {
          from: 'NRT',
          to: 'LHR',
          departureDate: '2026-02-12',
          arrivalDate: '2026-02-13',
          departureTime: '13:45',
          arrivalTime: '17:20'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'ORD',
          departureDate: '2026-02-14',
          arrivalDate: '2026-02-14',
          departureTime: '00:20',
          arrivalTime: '12:45'
        },
        {
          from: 'ORD',
          to: 'LHR',
          departureDate: '2026-02-14',
          arrivalDate: '2026-02-15',
          departureTime: '04:30',
          arrivalTime: '16:45'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'HKG',
          departureDate: '2026-02-05',
          arrivalDate: '2026-02-06',
          departureTime: '23:15',
          arrivalTime: '17:30'
        },
        {
          from: 'HKG',
          to: 'LHR',
          departureDate: '2026-02-08',
          arrivalDate: '2026-02-08',
          departureTime: '01:45',
          arrivalTime: '06:20'
        }
      ]
    ],
    maintenance: [
      {
        id: '15601',
        type: 'Planned',
        scheduleStartDate: '2026-02-08',
        scheduleEndDate: '2026-02-09',
        scheduleStartTime: '07:00',
        scheduleEndTime: '20:00'
      },
      {
        id: '15602',
        type: 'Planned',
        scheduleStartDate: '2026-02-25',
        scheduleEndDate: '2026-02-26',
        scheduleStartTime: '04:00',
        scheduleEndTime: '16:00'
      },
      {
        id: '15603',
        type: 'Planned',
        scheduleStartDate: '2026-02-16',
        scheduleEndDate: '2026-02-17',
        scheduleStartTime: '05:00',
        scheduleEndTime: '18:00'
      }
    ]
  },
  {
    tailNumber: "ZZ160",
    status: 'In flight',
    routes: [
      [
        {
          from: 'LHR',
          to: 'WAW',
          departureDate: '2026-02-05',
          arrivalDate: '2026-02-05',
          departureTime: '16:45',
          arrivalTime: '20:00'
        },
        {
          from: 'WAW',
          to: 'ICN',
          departureDate: '2026-02-05',
          arrivalDate: '2026-02-06',
          departureTime: '23:30',
          arrivalTime: '16:15'
        },
        {
          from: 'ICN',
          to: 'LHR',
          departureDate: '2026-02-07',
          arrivalDate: '2026-02-07',
          departureTime: '19:45',
          arrivalTime: '23:20'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'ZUR',
          departureDate: '2026-01-13',
          arrivalDate: '2026-01-13',
          departureTime: '06:30',
          arrivalTime: '09:15'
        },
        {
          from: 'ZUR',
          to: 'PVG',
          departureDate: '2026-01-13',
          arrivalDate: '2026-01-14',
          departureTime: '12:00',
          arrivalTime: '05:30'
        },
        {
          from: 'PVG',
          to: 'LHR',
          departureDate: '2026-01-15',
          arrivalDate: '2026-01-15',
          departureTime: '09:45',
          arrivalTime: '14:20'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'MUC',
          departureDate: '2026-02-11',
          arrivalDate: '2026-02-11',
          departureTime: '12:15',
          arrivalTime: '15:30'
        },
        {
          from: 'MUC',
          to: 'SIN',
          departureDate: '2026-02-11',
          arrivalDate: '2026-02-12',
          departureTime: '18:45',
          arrivalTime: '12:20'
        },
        {
          from: 'SIN',
          to: 'LHR',
          departureDate: '2026-02-13',
          arrivalDate: '2026-02-14',
          departureTime: '15:30',
          arrivalTime: '19:45'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'YYZ',
          departureDate: '2026-02-18',
          arrivalDate: '2026-02-18',
          departureTime: '13:45',
          arrivalTime: '16:20'
        },
        {
          from: 'YYZ',
          to: 'LHR',
          departureDate: '2026-02-20',
          arrivalDate: '2026-02-21',
          departureTime: '19:30',
          arrivalTime: '06:45'
        }
      ],
      [
        {
          from: 'LHR',
          to: 'DEL',
          departureDate: '2026-02-30',
          arrivalDate: '2026-02-31',
          departureTime: '02:15',
          arrivalTime: '14:45'
        },
        {
          from: 'DEL',
          to: 'LHR',
          departureDate: '2026-02-02',
          arrivalDate: '2026-02-02',
          departureTime: '18:30',
          arrivalTime: '22:15'
        }
      ]
    ],
    maintenance: [
      {
        id: '16001',
        type: 'Planned',
        scheduleStartDate: '2026-02-03',
        scheduleEndDate: '2026-02-04',
        scheduleStartTime: '07:00',
        scheduleEndTime: '17:00'
      },
      {
        id: '16002',
        type: 'In-Depth',
        scheduleStartDate: '2026-03-01',
        scheduleEndDate: '2026-03-07',
        scheduleStartTime: '06:00',
        scheduleEndTime: '18:00'
      },
      {
        id: '16003',
        type: 'Planned',
        scheduleStartDate: '2026-02-22',
        scheduleEndDate: '2026-02-23',
        scheduleStartTime: '04:00',
        scheduleEndTime: '16:00'
      }
    ]
  },
];