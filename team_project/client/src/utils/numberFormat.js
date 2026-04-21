//  숫자를 받아 천 단위 구분 기호(,)를 포함한 문자열로 반환합니다.
//  @param {number | string} value - 포맷팅할 숫자 값
//  @returns {string} - 포맷팅된 문자열

export default function numberFormat(value) {
  // 숫자가 null, undefined, 0인 경우를 처리
  if (value === null || value === undefined || value === 0) {
    return "0";
  }
  // 숫자가 아닌 값이 들어올 경우를 대비해 Number 타입으로 변환 후,
  // 정수 부분에 toLocaleString()을 사용하여 콤마를 추가합니다.
  const number = Number(value);

  // 한국어 환경에서는 'ko-KR' 로케일을 사용하여 콤마를 자동으로 추가합니다.
  return number.toLocaleString("ko-KR");
}
