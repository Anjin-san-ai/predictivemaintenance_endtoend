interface FlightSegment {
  departureTime: string;
  arrivalTime: string;
  route: string;
  isLanding?: boolean;
}

interface RouteLeg {
  from: string;
  to: string;
  departureDate: string;
  arrivalDate: string;
  departureTime: string;
  arrivalTime: string;
}

interface FlightDetailsPopupProps {
  routes?: RouteLeg[];
}

export default function FlightDetailsPopup({ routes }: Readonly<FlightDetailsPopupProps>) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(2);
    return `${day} ${month} ${year}`;
  };

  const flightSegments: FlightSegment[] = routes?.map((route, index) => ({
    departureTime: `${formatDate(route.departureDate)}, ${route.departureTime}`,
    arrivalTime: `${formatDate(route.arrivalDate)}, ${route.arrivalTime}`,
    route: `${route.from} - ${route.to}`,
    isLanding: index > 0 
  })) ?? []

  const paddingTop = 20;
  const paddingBottom = 20;
  const segmentSpacing = 68;
  
  const contentHeight = paddingTop + (flightSegments.length * segmentSpacing) + paddingBottom;
  const totalHeight = contentHeight + 15; 
  const backgroundHeight = contentHeight;

  return (
    <div className="w-[360px] relative lg:w-[400px] xl:w-[440px] 2xl:w-[480px]" style={{ height: `${totalHeight}px` }}>
      <div className="w-[366px] relative lg:w-[406px] xl:w-[446px] 2xl:w-[486px]" style={{ height: `${totalHeight}px` }}>
        <div className="absolute top-0 left-0 w-[360px] bg-[var(--color-bg-elevated)] rounded-[12.87px] shadow-[0px_4.29px_47.18px_rgba(0,0,0,0.25)] lg:w-[400px] xl:w-[440px] 2xl:w-[480px]" style={{ height: `${backgroundHeight}px` }}></div>
        
        <div 
          className="absolute w-4 h-[15px] bg-[var(--color-bg-elevated)] transform rotate-45 lg:left-[418px] xl:left-[458px] 2xl:left-[498px]" 
          style={{ 
            top: `${backgroundHeight - 7.5}px`, 
            left: '348px' 
          }}
        ></div>

        <div 
          className="flex flex-col relative z-10 pt-5 pl-4 pb-5"
        >
          {flightSegments.map((segment, index) => (
            <div 
              key={`${segment.departureTime}-${segment.route}`} 
              className="flex"
              style={{ 
                minHeight: index === flightSegments.length - 1 ? 'auto' : `${segmentSpacing}px`
              }}
            >
              <div className="flex flex-col items-start w-[37px]">
                <div className="relative w-[21px] h-[21px]">
                  <div className="w-[21px] h-[21px] bg-gray-300 rounded-full"></div>
                  <div className="absolute top-[4.5px] left-[4.5px] w-3 h-3 flex items-center justify-center">
                    {index === 0 ? (
                      <img 
                        src="/images/flight-details-popup/airplane-take-off.png" 
                        alt="Take off" 
                        className="w-3 h-3" 
                      />
                    ) : index === flightSegments.length - 1 ? (
                      <img 
                        src="/images/flight-details-popup/airplane-landing-1.png" 
                        alt="Final Landing" 
                        className="w-3 h-3" 
                      />
                    ) : (
                      <img 
                        src="/images/flight-details-popup/airplane-landing.png" 
                        alt="Landing" 
                        className="w-3 h-3" 
                      />
                    )}
                  </div>
                </div>
                
                {index < flightSegments.length - 1 && (
                  <div 
                    className="w-px ml-[10.5px] border-l border-dashed border-gray-500 bg-transparent"
                    style={{ 
                      height: `${segmentSpacing - 21}px`
                    }}
                  ></div>
                )}
              </div>

              <div className="flex flex-col flex-1">
                <div className="font-roboto font-bold text-[#2AF556] text-[19.3px] leading-normal whitespace-nowrap -mt-px">
                  {segment.route}
                </div>
                
                <div className="flex items-center">
                  <div className="font-roboto font-normal text-[var(--color-text-secondary)] text-[15px] leading-normal whitespace-nowrap">
                    {segment.departureTime}
                  </div>
                  
                  <div className="relative w-[41px] h-[5px] mx-[49px]">
                    <div className="absolute top-0 left-0 w-[5px] h-[5px] bg-gray-300 rounded-[2.68px]"></div>
                    <div className="absolute top-[2px] left-[2px] w-[35px] h-px bg-gray-300"></div>
                    <div className="absolute top-0 right-0 w-[5px] h-[5px] bg-gray-300 rounded-[2.68px]"></div>
                  </div>
                  
                  <div className="font-roboto font-normal text-[var(--color-text-secondary)] text-[15px] leading-normal whitespace-nowrap">
                    {segment.arrivalTime}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}