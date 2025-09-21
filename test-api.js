// Test script to verify API endpoints
// Run this file with: node test-api.js

const BASE_URL = 'http://localhost:8080';

async function testAPI() {
  console.log('🧪 Testing Water Monitoring API endpoints...\n');

  try {
    // Test 1: Get all markers (should return empty array initially)
    console.log('1️⃣ Testing GET /api/markers');
    const markersResponse = await fetch(`${BASE_URL}/api/markers`);
    const markersData = await markersResponse.json();
    console.log('✅ Response:', markersData);
    console.log('📊 Found', markersData.markers?.length || 0, 'markers\n');

    // Test 2: Create a symptom report marker
    console.log('2️⃣ Testing POST /api/markers/symptom-report');
    const symptomReport = {
      date: '2025-09-21',
      location: {
        address: 'Test Location, Test City',
        coordinates: { lat: 20.5937, lng: 78.9629 }
      },
      symptoms: ['Diarrhea', 'Fever'],
      affectedCount: 3,
      notes: 'Test report from API test',
      severity: 'medium',
      reportedBy: 'test-user'
    };

    const symptomResponse = await fetch(`${BASE_URL}/api/markers/symptom-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(symptomReport)
    });
    const symptomData = await symptomResponse.json();
    console.log('✅ Response:', symptomData);
    
    if (symptomData.success) {
      console.log('🎉 Successfully created symptom report marker!');
      const markerId = symptomData.marker._id;
      console.log('📍 Marker ID:', markerId, '\n');

      // Test 3: Get all markers again (should now show 1 marker)
      console.log('3️⃣ Testing GET /api/markers (after creating one)');
      const updatedMarkersResponse = await fetch(`${BASE_URL}/api/markers`);
      const updatedMarkersData = await updatedMarkersResponse.json();
      console.log('✅ Response:', updatedMarkersData);
      console.log('📊 Found', updatedMarkersData.markers?.length || 0, 'markers\n');

      // Test 4: Create a water test marker
      console.log('4️⃣ Testing POST /api/markers/water-test');
      const waterTest = {
        location: {
          address: 'Water Source A, Test District',
          coordinates: { lat: 20.6, lng: 79.0 }
        },
        testResults: {
          pH: 6.5,
          turbidity: 15,
          chlorine: 0.2,
          bacteria: 'present'
        },
        kitUsed: 'Basic Water Test Kit',
        riskLevel: 'high',
        recommendations: ['Boil water before use', 'Install filtration'],
        testedBy: 'test-agent'
      };

      const waterResponse = await fetch(`${BASE_URL}/api/markers/water-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(waterTest)
      });
      const waterData = await waterResponse.json();
      console.log('✅ Response:', waterData);
      
      if (waterData.success) {
        console.log('🎉 Successfully created water test marker!\n');
      }

      // Test 5: Create a manual marker
      console.log('5️⃣ Testing POST /api/markers/manual');
      const manualMarker = {
        title: 'Test Intervention Site',
        description: 'API test manual marker',
        location: {
          address: 'Intervention Site, Test Area',
          coordinates: { lat: 20.55, lng: 78.95 }
        },
        markerType: 'intervention',
        priority: 'high',
        status: 'active',
        createdBy: 'test-admin'
      };

      const manualResponse = await fetch(`${BASE_URL}/api/markers/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualMarker)
      });
      const manualData = await manualResponse.json();
      console.log('✅ Response:', manualData);
      
      if (manualData.success) {
        console.log('🎉 Successfully created manual marker!\n');
      }

      // Test 6: Get markers by type
      console.log('6️⃣ Testing GET /api/markers/type/symptom_report');
      const typeResponse = await fetch(`${BASE_URL}/api/markers/type/symptom_report`);
      const typeData = await typeResponse.json();
      console.log('✅ Response:', typeData);
      console.log('📊 Found', typeData.markers?.length || 0, 'symptom report markers\n');

      // Final summary
      console.log('🎯 Final marker count check:');
      const finalResponse = await fetch(`${BASE_URL}/api/markers`);
      const finalData = await finalResponse.json();
      console.log('📊 Total markers:', finalData.markers?.length || 0);
      
      finalData.markers?.forEach((marker, index) => {
        console.log(`   ${index + 1}. ${marker.type} - ${marker.location?.address} (${marker._id})`);
      });

    } else {
      console.log('❌ Failed to create symptom report:', symptomData.error);
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// Run the tests
testAPI();