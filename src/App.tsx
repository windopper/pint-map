import { useEffect, useRef, useState } from 'react';
import { Map, MapMarker, useMap } from 'react-kakao-maps-sdk';
import { MarkerProps } from './type/Marker';

declare global {
  interface Window {
    ReactNativeWebView: any;
  }
}

function App() {
  const placesRef = useRef<kakao.maps.services.Places>();
  const [map, setMap] = useState<kakao.maps.Map>();
  const [state, setState] = useState({
    center: {
      lat: 33.450701,
      lng: 126.570667,
    },
    isPanto: true, 
  })

  const [markers, setMarkers] = useState<MarkerProps[]>([]); // 마커 목록

  const addMarker = ({ title, lat, lng, type }: MarkerProps) => {
    setMarkers((prev) => [
      ...prev,
      {
        title,
        lat,
        lng,
        type,
      }
    ])
  }

  const listener = (event: any) => {
    try {
      const { type, data } = JSON.parse(event.data);
  
      switch (type) {
        case "CURRENT_LOCATION":
          onLocation(data.lat, data.lng);
          break;
        case "CATEGORY_SEARCH":
          onCategorySearch({ categories: data.categories, radius: data.radius });
          break;
        case "KEYWORD_SEARCH":
          onKeywordSearch({ keyword: data.keyword, page: data.page, sortBy: data.sortBy});
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(error);
    }
  }

  const onLocation = (lat: number, lng: number) => {
    if (!map) return;
    map.panTo(new kakao.maps.LatLng(lat, lng));
    // remove my marker
    setMarkers((prev) => prev.filter((marker) => marker.type !== "MYLOCATION"));
    addMarker({
      title: "내 위치",
      lat,
      lng,
      type: "MYLOCATION",
    });
  }

  const onCategorySearch = ({categories, radius = 5000}: { categories: any, radius?: number}) => {
    console.log(placesRef.current)

    for (let category of categories) {
      placesRef.current?.categorySearch(category, (result: kakao.maps.services.PlacesSearchResult, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const places: MarkerProps[] = []
          for (const place of result) {
            const { x, y } = place;
            // console.log(place)
            places.push({
              title: place.place_name,
              lat: Number(y),
              lng: Number(x),
              type: "CATEGORY",
              onClick: () => {
                postMessage("CLICK_MARKER", {
                  place,
                })
              }
            })
          }
          setMarkers(places);
          
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          alert("검색 결과가 존재하지 않습니다.")
        } else if (status === window.kakao.maps.services.Status.ERROR) {
          alert("검색 결과 중 오류가 발생했습니다.")
        }
      }, { useMapCenter: true, radius, sort: window.kakao.maps.services.SortBy.DISTANCE });
    }
  }

  const onKeywordSearch = ({ keyword, sortBy = "accuracy", page = 1}: { keyword: string, sortBy?: string, page?: number }) => {
    placesRef.current?.keywordSearch(
      keyword,
      (result: kakao.maps.services.PlacesSearchResult, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          postMessage("SEARCH_RESULT", result);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          alert("검색 결과가 존재하지 않습니다.");
        } else if (status === window.kakao.maps.services.Status.ERROR) {
          alert("검색 결과 중 오류가 발생했습니다.");
        }
      },
      {
        sort:
          sortBy === "accuracy"
            ? window.kakao.maps.services.SortBy.ACCURACY
            : window.kakao.maps.services.SortBy.DISTANCE,
        page
      }
    );
  }

  useEffect(() => {
    document.addEventListener("message", listener);
    window.addEventListener("message", listener);

    return () => {
      document.removeEventListener("message", listener);
      window.removeEventListener("message", listener);
    }
  }, [])

  useEffect(() => {
    if (!map) return;
    placesRef.current = new kakao.maps.services.Places(map);
  }, [map])
  
  const postMessage = (type: any, data: any) => {
    if (!window.ReactNativeWebView) return;
  
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type,
        data,
      })
    );
  }

  return (
    <>
      <Map // 지도를 표시할 Containe집
      id="map"
      center={state.center}
      isPanto={state.isPanto}
      style={{
        // 지도의 크기
        width: "100vw",
        height: "100vh",
      }}
      level={3} // 지도의 확대 레벨
      onCreate={setMap}
    >
      {markers.map((marker, index) => (
        <MapMarker
          key={`${marker.title}-${marker.lat}-${marker.lng}`}
          position={{ lat: marker.lat, lng: marker.lng }}
          title={marker.title}
          image={{
            src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png", // 마커이미지의 주소입니다
            size: {
              width: 24,
              height: 35
            }, // 마커이미지의 크기입니다
          }}
          onClick={marker.onClick}
        />
      ))}
    </Map>
    </>
  )
}

export default App;

